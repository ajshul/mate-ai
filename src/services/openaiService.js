const OpenAI = require("openai");
const Message = require("../models/Message");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use the model from environment variables or default to gpt-4-vision-preview
const MODEL = process.env.OPENAI_MODEL || "gpt-4-vision-preview";

/**
 * Get previous conversation messages for context
 * @param {string} userId - User ID to fetch conversation history
 * @returns {Array} - Array of previous messages
 */
async function getPreviousMessages(userId) {
  try {
    // Get the last 10 messages for context, ordered by timestamp
    const messages = await Message.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Return in chronological order for the API
    return messages.reverse().map((msg) => {
      // If it's a regular text message
      if (!msg.imageUrl) {
        return {
          role: msg.isFromUser ? "user" : "assistant",
          content: msg.content,
        };
      }
      // If it's a message with an image
      else {
        return {
          role: msg.isFromUser ? "user" : "assistant",
          content: [
            { type: "text", text: msg.content || "What's in this image?" },
            {
              type: "image_url",
              image_url: { url: msg.imageUrl },
            },
          ],
        };
      }
    });
  } catch (error) {
    console.error("Error fetching previous messages:", error);
    return [];
  }
}

/**
 * Get completion from OpenAI API
 * @param {string|Object} userInput - Latest user input (text or object with text/image)
 * @param {string} userId - User ID for conversation history
 * @returns {Promise<string>} - AI response
 */
async function getCompletion(userInput, userId) {
  try {
    // Get conversation history
    const previousMessages = await getPreviousMessages(userId);

    // Create messages array with system prompt and conversation history
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful, friendly AI assistant called Mate AI, communicating through a messaging app. Be conversational, natural, and helpful. Never mention that you are powered by a specific company or mention that you are in a trial account.",
      },
      ...previousMessages,
    ];

    // Add the current user message
    if (typeof userInput === "string") {
      // If it's just a text message
      messages.push({ role: "user", content: userInput });
    } else if (userInput.imageUrl) {
      // Check if we have a valid image URL
      if (!userInput.imageUrl) {
        throw new Error("Missing image URL");
      }

      // Validate base64 image data if that's what we have
      if (userInput.imageUrl.startsWith("data:")) {
        try {
          // Verify the base64 image format is correct
          const [metaPart, dataPart] = userInput.imageUrl.split(",");
          if (!metaPart || !dataPart) {
            throw new Error("Invalid base64 image format");
          }

          // Check image type is one of the supported types
          if (
            !metaPart.includes("image/jpeg") &&
            !metaPart.includes("image/png") &&
            !metaPart.includes("image/gif") &&
            !metaPart.includes("image/webp")
          ) {
            throw new Error(`Unsupported image format: ${metaPart}`);
          }

          // Make sure we have some base64 data
          if (dataPart.length < 100) {
            throw new Error("Image data too short, likely invalid");
          }

          console.log(
            `Valid base64 image detected: ${metaPart}, data length: ${dataPart.length}`
          );
        } catch (error) {
          console.error("Base64 image validation error:", error);
          throw new Error("Invalid image format: " + error.message);
        }
      }

      console.log(
        `Processing image input. Type: ${userInput.imageUrl.substring(
          0,
          30
        )}...`
      );

      // If it includes an image - the image URL can be a base64 string or a URL
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userInput.text || "What's in this image?" },
          {
            type: "image_url",
            image_url: { url: userInput.imageUrl },
          },
        ],
      });
    }

    console.log(`Sending ${messages.length} messages to OpenAI API`);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm sorry, I encountered an error processing your request. Please try again later.";
  }
}

module.exports = {
  getCompletion,
};
