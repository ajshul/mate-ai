const OpenAI = require("openai");
const Message = require("../models/Message");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    return messages.reverse().map((msg) => ({
      role: msg.isFromUser ? "user" : "assistant",
      content: msg.content,
    }));
  } catch (error) {
    console.error("Error fetching previous messages:", error);
    return [];
  }
}

/**
 * Get completion from OpenAI API
 * @param {string} userMessage - Latest user message
 * @param {string} userId - User ID for conversation history
 * @returns {Promise<string>} - AI response
 */
async function getCompletion(userMessage, userId) {
  try {
    // Get conversation history
    const previousMessages = await getPreviousMessages(userId);

    // Create messages array with system prompt and conversation history
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful, friendly AI assistant communicating through iMessage. Be concise but helpful.",
      },
      ...previousMessages,
      { role: "user", content: userMessage },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm sorry, I encountered an error. Please try again later.";
  }
}

module.exports = {
  getCompletion,
};
