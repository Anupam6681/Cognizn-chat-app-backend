const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const twilioService = require("../services/twilio.service");
const cloudinaryService = require("../services/cloudinary.service");
const jwt = require("jsonwebtoken");
// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const { User, Group, ProfileImage } = require("../models"); // Adjust the path as necessary

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });

    if (user && password === user.dataValues.password) {
      const groupIDs = user.dataValues.groupIDList;
      const token = jwt.sign(
        { id: user.dataValues.id, username: user.dataValues.username },
        "your_jwt_secret",
        { expiresIn: "1h" }
      );

      if (groupIDs && groupIDs.length > 0) {
        // Find groups by IDs
        const groups = await Group.findAll({
          where: {
            id: groupIDs,
          },
          attributes: ["id", "group_name", "sid"], // Including sid
        });

        const groupDetails = groups.map((group) => ({
          id: group.id,
          group_name: group.group_name,
          sid: group.sid,
        }));

        res.status(200).json({
          token,
          userid: user.dataValues.id,
          username: user.dataValues.username,
          groupidlist: groupDetails,
        });
      } else {
        // If no groups are found
        res.status(200).json({
          token,
          userid: user.dataValues.id,
          username: user.dataValues.username,
          groupidlist: [],
        });
      }
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});
// Create a new conversation
router.post("/conversations", async (req, res) => {
  try {
    const { name } = req.body;
    const conversation = await twilioService.createConversation(name);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a participant to a conversation
router.post("/conversations/:sid/participants", async (req, res) => {
  try {
    const { sid } = req.params;
    const { identity } = req.body;
    const participant = await twilioService.addParticipant(sid, identity);
    res.status(201).json(participant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Send a media message
router.post(
  "/conversations/:sid/media-messages",
  upload.single("file"),
  async (req, res) => {
    try {
      const { sid } = req.params;
      const { body, author } = req.body; // Include body in the request body

      let mediaUrl = null;

      if (req.file) {
        // Upload file to Cloudinary
        await new Promise((resolve, reject) => {
          cloudinaryService.cloudinaryTranscriberFileUpload(
            req.file.path,
            { publicId: req.file.filename },
            (result) => {
              if (result && result.secure_url) {
                mediaUrl = result.secure_url;
                resolve();
              } else {
                reject(new Error("Failed to upload file to Cloudinary"));
              }
            }
          );
        });

        // Clean up the local file after uploading
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Failed to delete local file:", err);
        });
      }
      console.log("djjjjjj", mediaUrl);
      // Send media message
      const message = await twilioService.sendMediaMessage(
        sid,
        author,
        body,
        mediaUrl
      );

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Send a message
router.post("/conversations/:sid/messages", async (req, res) => {
  try {
    const { sid } = req.params;
    const { textmessage, username } = req.body; // Include author in the request body

    const message = await twilioService.sendMessage(sid, textmessage, username); // Pass author to the service function
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all conversations
router.get("/conversations", async (req, res) => {
  try {
    // Access the userid from query parameters
    const userid = req.query.userid;
    if (!userid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch the user's data including the groupIDList
    const user = await User.findOne({ where: { id: userid } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Directly access the groupIDList from the instance
    const groupIDList = user.groupIDList || [];
    const sidList = [];
    const username = user.username;
    // Fetch all groups based on the user's groupIDList
    const groups = await Group.findAll({
      where: {
        id: groupIDList,
      },
      attributes: ["sid", "group_name"],
    });

    // Create a dictionary to map group names to sids
    const groupNameToSids = {};
    groups.forEach((group) => {
      if (!groupNameToSids[group.group_name]) {
        groupNameToSids[group.group_name] = new Set();
      }
      sidList.push(group.sid);
      groupNameToSids[group.group_name].add(group.sid);
    });

    // Fetch all conversations from Twilio
    const conversations = await twilioService.listConversations();

    // Prepare the response
    const conversationList = conversations.map((conversation) => {
      const { sid, friendlyName: groupname } = conversation;
      const isUserInGroup = sidList.includes(sid);
      return {
        sid,
        groupname: groupname,
        status: isUserInGroup ? 1 : 0,
      };
    });

    const response = {
      username: username,
      conversations: conversationList,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all messages in a conversation
async function getUserProfileImageUrl(username) {
  try {
    // Query the user table based on the username to get the user details
    const user = await User.findOne({ where: { username } });
    if (user) {
      // Query the profile image table based on the user ID
      const profileImage = await ProfileImage.findOne({
        where: { userId: user.id },
      });
      return profileImage ? profileImage.url : null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile image URL:", error);
    return null;
  }
}

router.get("/conversations/:sid/messages", async (req, res) => {
  try {
    const { sid } = req.params;
    const messages = await twilioService.listMessages(sid);

    // Map through messages and include profile image URL and username
    const enhancedMessages = await Promise.all(
      messages.map(async (message) => {
        const { sid, body, author } = message;

        // Determine the username from the author field
        const username = author.includes("@") ? author.split("@")[0] : author;
        const profileImageUrl = await getUserProfileImageUrl(username);

        return {
          sid,
          body,
          username,
          profileImageUrl,
        };
      })
    );

    res.status(200).json(enhancedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/add_participants", upload.single("file"), async (req, res) => {
  try {
    const { sid, username, userid } = req.body;

    // Add participant using the Twilio service
    const participant = await twilioService.addParticipant(sid, username);
    let mediaUrl;
    let publicId;

    // Insert a new entry into the profile_image table with the userId
    const profileimage = await ProfileImage.create({
      userId: userid,
    });
    const profileimageId = profileimage.imageID;
    var config = { profileimageId: profileimageId };
    if (req.file) {
      // Upload file to Cloudinary
      await new Promise((resolve, reject) => {
        cloudinaryService.cloudinaryTranscriberFileUpload(
          req.file.path,
          config,
          async (result) => {
            if (result && result.secure_url) {
              mediaUrl = result.secure_url;
              publicId = result.public_id;
              await ProfileImage.update(
                { url: mediaUrl, publicID: publicId },
                { where: { imageID: profileimageId } }
              );
              resolve();
            } else {
              reject(new Error("Failed to upload file to Cloudinary"));
            }
          }
        );
      });

      // Clean up the local file after uploading
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });
    }
    // Find the group based on the sid
    const group = await Group.findOne({ where: { sid } });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Find the user by username
    const user = await User.findOne({ where: { username } });

    if (user) {
      let groupIDList = user.groupIDList || [];

      // Convert groupIDList to an array if it's not already (in case it's stored as a string)
      if (typeof groupIDList === "string") {
        groupIDList = JSON.parse(groupIDList);
      }

      // Add the group ID to the list if it's not already present
      if (!groupIDList.includes(group.id)) {
        groupIDList.push(group.id);

        // Update the user's groupIDList
        await user.update({ groupIDList });
      }
    }

    res.status(201).json(participant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
