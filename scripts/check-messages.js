require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("../src/models/Message");
const User = require("../src/models/User");

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mate-ai"
    );
    console.log("Connected to MongoDB");

    // Find the most recent user
    const user = await User.findOne().sort({ lastInteraction: -1 });

    if (!user) {
      console.log("No users found");
      process.exit(0);
    }

    console.log(`Found user: ${user.phoneNumber}`);

    // Find messages for this user
    const messages = await Message.find({ user: user._id }).sort({
      timestamp: 1,
    });

    if (messages.length === 0) {
      console.log("No messages found for this user");

      // Create a test message
      console.log("Creating a test user message...");
      const userMessage = new Message({
        user: user._id,
        content: "Hello! This is a test message from the user.",
        isFromUser: true,
      });
      await userMessage.save();

      console.log("Creating a test assistant message...");
      const assistantMessage = new Message({
        user: user._id,
        content: "Hi there! I am Mate AI. How can I help you today?",
        isFromUser: false,
      });
      await assistantMessage.save();

      console.log("Test messages created successfully");
    } else {
      console.log(`Found ${messages.length} messages:`);

      messages.forEach((msg, i) => {
        console.log(
          `${i + 1}. ${msg.isFromUser ? "User" : "Assistant"}: ${
            msg.content
          } (${msg.timestamp})`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

main();
