const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const chatRoutes = require("./routers/chat.routes");
require("dotenv").config();
const twilio = require("twilio");
const { sequelize } = require("./models");
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;

// // const client = twilio(accountSid, authToken);
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from this origin
  })
);
app.use(bodyParser.json());
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 3000;
sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
