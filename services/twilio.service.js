require("dotenv").config();
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

module.exports = {
  client,
  createConversation: async (name) => {
    return client.conversations.conversations.create({ friendlyName: name });
  },

  addParticipant: async (conversationSid, identity) => {
    return client.conversations
      .conversations(conversationSid)
      .participants.create({ identity });
  },

  sendMediaMessage: async (conversationSid, author, body, mediaUrl) => {
    return client.conversations.conversations(conversationSid).messages.create({
      author: author,
      body: body,
      mediaUrl: mediaUrl ? [mediaUrl] : [], // Array of media URLs
    });
  },
  sendMessage: async (conversationSid, message, author) => {
    return client.conversations
      .conversations(conversationSid)
      .messages.create({ author: author, body: message });
  },

  listConversations: async () => {
    return client.conversations.conversations.list();
  },

  listMessages: async (conversationSid) => {
    return client.conversations.conversations(conversationSid).messages.list();
  },
};
