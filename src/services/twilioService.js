const twilio = require("twilio");
const User = require("../models/User");

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Create a conversation
 * @returns {Promise} Conversation object
 */
async function createConversation(friendlyName) {
  try {
    // Skip configuring service for now as it doesn't work properly
    // await configureConversationService();

    const conversation = await client.conversations.v1.conversations.create({
      friendlyName: friendlyName || "Mate AI Conversation",
    });

    console.log(`Conversation created with SID: ${conversation.sid}`);
    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }
}

/**
 * Configure conversation service to disable default messages
 * Note: This is not working correctly with the API version and needs to be fixed
 */
async function configureConversationService() {
  try {
    // Get the default conversation service - skip for now
    // This functionality is not working properly with the current API version
    return null;
  } catch (error) {
    console.error("Error configuring conversation service:", error);
    return null;
  }
}

/**
 * Add a participant to a conversation
 * @param {string} conversationSid - The conversation SID
 * @param {string} phoneNumber - The phone number to add
 * @returns {Promise} Participant object
 */
async function addParticipant(conversationSid, phoneNumber) {
  try {
    // Add attributes to customize messaging behavior
    const attributes = JSON.stringify({
      custom_message_behavior: {
        suppress_stop_help_message: true, // Suppress STOP/HELP messages
      },
    });

    // Check if participant already exists by listing the participants
    const participants = await client.conversations.v1
      .conversations(conversationSid)
      .participants.list();

    const existingParticipant = participants.find(
      (p) => p.messagingBinding && p.messagingBinding.address === phoneNumber
    );

    if (existingParticipant) {
      console.log(
        `Participant already exists with SID: ${existingParticipant.sid}`
      );
      return existingParticipant;
    }

    const participant = await client.conversations.v1
      .conversations(conversationSid)
      .participants.create({
        "messagingBinding.address": phoneNumber,
        "messagingBinding.proxyAddress": process.env.TWILIO_PHONE_NUMBER,
        attributes: attributes,
      });

    console.log(`Participant added with SID: ${participant.sid}`);
    return participant;
  } catch (error) {
    console.error("Error adding participant:", error);
    // This is not a critical error, so we don't need to throw
    return null;
  }
}

/**
 * Find all conversations for a given phone number
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Array>} - Array of conversation SIDs
 */
async function findConversationsForUser(phoneNumber) {
  try {
    const conversations = await client.conversations.v1.conversations.list({
      limit: 100,
    });
    const userConversations = [];

    // For each conversation, check if the user is a participant
    for (const conversation of conversations) {
      try {
        const participants = await client.conversations.v1
          .conversations(conversation.sid)
          .participants.list();

        const userIsParticipant = participants.some(
          (p) =>
            p.messagingBinding && p.messagingBinding.address === phoneNumber
        );

        if (userIsParticipant) {
          userConversations.push(conversation.sid);
        }
      } catch (err) {
        console.error(
          `Error checking participants for conversation ${conversation.sid}:`,
          err
        );
      }
    }

    return userConversations;
  } catch (error) {
    console.error("Error finding conversations for user:", error);
    return [];
  }
}

/**
 * Reset a user's conversation by deleting the old ones and creating a new one
 * @param {object} user - The user object with phoneNumber
 * @returns {Promise<string>} - The new conversation SID
 */
async function resetConversation(user) {
  try {
    const phoneNumber = user.phoneNumber;

    console.log(`Resetting conversation for user: ${phoneNumber}`);

    // Find all conversations in Twilio that have this phone number in their friendly name
    const allConversations = await client.conversations.v1.conversations.list({
      limit: 100,
    });
    const userConversations = [];

    // Add any conversation where the user is a participant
    for (const conversation of allConversations) {
      if (
        conversation.friendlyName &&
        conversation.friendlyName.includes(phoneNumber)
      ) {
        userConversations.push(conversation.sid);
        continue;
      }

      // Double-check participants to be thorough
      try {
        const participants = await client.conversations.v1
          .conversations(conversation.sid)
          .participants.list();

        const userIsParticipant = participants.some(
          (p) =>
            p.messagingBinding && p.messagingBinding.address === phoneNumber
        );

        if (
          userIsParticipant &&
          !userConversations.includes(conversation.sid)
        ) {
          userConversations.push(conversation.sid);
        }
      } catch (err) {
        console.error(
          `Error checking participants for conversation ${conversation.sid}:`,
          err
        );
      }
    }

    console.log(
      `Found ${userConversations.length} conversations for user ${phoneNumber}`
    );

    // Delete all conversations for this user
    for (const conversationSid of userConversations) {
      try {
        await client.conversations.v1.conversations(conversationSid).remove();
        console.log(`Deleted conversation: ${conversationSid}`);
      } catch (err) {
        console.error(
          `Could not delete conversation ${conversationSid}:`,
          err.message
        );
      }
    }

    // Ensure we're waiting long enough for Twilio to complete operations
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a new conversation
    const conversation = await createConversation(
      `Conversation for ${phoneNumber}`
    );

    // Add the user as a participant
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const participant = await client.conversations.v1
      .conversations(conversation.sid)
      .participants.create({
        "messagingBinding.address": phoneNumber,
        "messagingBinding.proxyAddress": process.env.TWILIO_PHONE_NUMBER,
        attributes: JSON.stringify({
          custom_message_behavior: {
            suppress_stop_help_message: true,
          },
        }),
      });

    console.log(`Added participant to new conversation: ${participant.sid}`);

    // Send welcome message
    const welcomeMessage =
      "Welcome back! Your conversation has been reset. How can I help you today?";
    await sendMessage(phoneNumber, welcomeMessage, conversation.sid);

    return conversation.sid;
  } catch (error) {
    console.error("Error resetting conversation:", error);
    throw new Error("Failed to reset conversation");
  }
}

/**
 * Send a rich message via Twilio Conversations API
 * @param {string} to - Recipient phone number
 * @param {string} body - Message content
 * @param {string} conversationSid - Optional conversation SID
 * @returns {Promise}
 */
async function sendMessage(to, body, conversationSid = null) {
  try {
    let convoSid = conversationSid;

    // If no conversation exists, create one and add the participant
    if (!convoSid) {
      const conversation = await createConversation(`Conversation with ${to}`);
      convoSid = conversation.sid;
      await addParticipant(convoSid, to);
    }

    // Define a consistent author name to help with webhook filtering
    const authorName = "Mate AI";

    // Set message attributes to help identify system messages
    const attributes = JSON.stringify({
      isSystemMessage: true,
      source: "app_backend",
    });

    // Send the message to the conversation with consistent author and attributes
    const message = await client.conversations.v1
      .conversations(convoSid)
      .messages.create({
        body: body,
        author: authorName,
        attributes: attributes,
      });

    console.log(`Message sent with SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error("Twilio error:", error);
    throw new Error("Failed to send message");
  }
}

/**
 * Send a rich content message via Twilio Conversations API
 * @param {string} to - Recipient phone number
 * @param {string} conversationSid - Conversation SID
 * @param {string} contentSid - Content template SID
 * @param {object} variables - Variables for the content template
 * @returns {Promise}
 */
async function sendRichMessage(
  to,
  conversationSid,
  contentSid,
  variables = {}
) {
  try {
    let convoSid = conversationSid;

    // If no conversation exists, create one and add the participant
    if (!convoSid) {
      const conversation = await createConversation(`Conversation with ${to}`);
      convoSid = conversation.sid;
      await addParticipant(convoSid, to);
    }

    // Define a consistent author name and attributes
    const authorName = "Mate AI";
    const attributes = JSON.stringify({
      isSystemMessage: true,
      source: "app_backend",
    });

    // Send rich content message to the conversation
    const message = await client.conversations.v1
      .conversations(convoSid)
      .messages.create({
        contentSid: contentSid,
        contentVariables: JSON.stringify(variables),
        author: authorName,
        attributes: attributes,
      });

    console.log(`Rich message sent with SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error("Twilio error:", error);
    throw new Error("Failed to send rich message");
  }
}

/**
 * Create a TwiML response
 * @param {string} message - Message to include in the response
 * @returns {Object} - TwiML response object
 */
function createTwimlResponse(message) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();
  twiml.message(message);
  return twiml;
}

/**
 * Get media content from Twilio using the media SID
 * @param {string} mediaSid - The Twilio media SID
 * @param {string} conversationSid - Optional conversation SID for context
 * @returns {Promise<Object>} - Object with media URL and content type
 */
async function getMediaContent(mediaSid, conversationSid = null) {
  try {
    console.log(`Retrieving media content for SID: ${mediaSid}`);

    // Get the Twilio account SID and auth token
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Try to get info about the conversation this media is attached to
    let serviceSid;
    try {
      if (conversationSid) {
        const conversation = await client.conversations.v1
          .conversations(conversationSid)
          .fetch();
        serviceSid = conversation.chatServiceSid;
        console.log(
          `Found service SID ${serviceSid} for conversation ${conversationSid}`
        );
      } else {
        const services = await client.conversations.v1.services.list({
          limit: 1,
        });
        if (services && services.length > 0) {
          serviceSid = services[0].sid;
        }
      }
    } catch (err) {
      console.log("Could not get conversation service SID, using default");
    }

    // If we couldn't find a service SID, use the default service
    if (!serviceSid) {
      serviceSid = "IS00000000000000000000000000000000";
    }

    // Construct the Twilio Media Resource URL
    // Note: This gets the actual binary data, not just metadata
    const mediaUrl = `https://mcs.us1.twilio.com/v1/Services/${serviceSid}/Media/${mediaSid}/Content`;

    console.log(`Using Twilio media content URL: ${mediaUrl}`);

    return {
      url: mediaUrl,
      auth: {
        username: accountSid,
        password: authToken,
      },
    };
  } catch (error) {
    console.error("Error retrieving media content:", error);
    throw new Error("Failed to retrieve media content");
  }
}

/**
 * Clean up duplicate conversations for all users
 * @param {string} webhookUrl - The webhook URL endpoint to check for duplicates (kept for backward compatibility)
 * @returns {Promise<number>} - Number of conversations removed
 */
async function cleanupDuplicateWebhooks(webhookUrl = null) {
  try {
    console.log("Starting conversation cleanup...");
    let removedCount = 0;

    // Get all conversations from Twilio
    const allConversations = await client.conversations.v1.conversations.list({
      limit: 100,
    });
    console.log(
      `Found ${allConversations.length} total conversations in Twilio`
    );

    // Group conversations by friendly name (which contains the phone number)
    const conversationsByName = {};

    // Log all conversations
    console.log("Listing all conversations:");
    allConversations.forEach((convo) => {
      console.log(
        `Conversation: ${convo.sid}, FriendlyName: ${convo.friendlyName}`
      );

      // Group by friendly name
      if (convo.friendlyName) {
        if (!conversationsByName[convo.friendlyName]) {
          conversationsByName[convo.friendlyName] = [];
        }
        conversationsByName[convo.friendlyName].push(convo);
      }
    });

    // Find phone numbers with multiple conversations
    console.log("Checking for numbers with multiple conversations...");

    // Get all users from database
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);

    // Build mapping of phone numbers to user IDs and conversation SIDs
    const phoneToUserMap = {};
    users.forEach((user) => {
      if (!user.phoneNumber) return;

      if (!phoneToUserMap[user.phoneNumber]) {
        phoneToUserMap[user.phoneNumber] = [];
      }

      phoneToUserMap[user.phoneNumber].push({
        userId: user._id,
        conversationSid: user.conversationSid,
      });
    });

    // Check for duplicate users with the same phone number
    for (const [phoneNumber, userList] of Object.entries(phoneToUserMap)) {
      if (userList.length > 1) {
        console.log(
          `Found duplicate users for number ${phoneNumber}! User count: ${userList.length}`
        );

        // Keep only the most recently active user
        const sortedUsers = await User.find({ phoneNumber: phoneNumber }).sort({
          lastInteraction: -1,
        });

        // Keep the first (most recent) one, delete others
        for (let i = 1; i < sortedUsers.length; i++) {
          console.log(
            `Removing duplicate user: ${sortedUsers[i]._id} with phone ${phoneNumber}`
          );
          await User.findByIdAndDelete(sortedUsers[i]._id);
          removedCount++;
        }
      }
    }

    // Now clean up duplicate conversations for each phone number
    for (const [friendlyName, conversations] of Object.entries(
      conversationsByName
    )) {
      // Extract phone number from friendly name
      const phoneNumberMatch = friendlyName.match(/\+\d{10,}/);
      if (!phoneNumberMatch) continue;

      const phoneNumber = phoneNumberMatch[0];

      if (conversations.length > 1) {
        console.log(
          `Found ${conversations.length} conversations for ${phoneNumber} with friendly name "${friendlyName}"`
        );

        // Find the user for this phone number
        const user = await User.findOne({ phoneNumber: phoneNumber });

        if (user) {
          console.log(
            `User found for ${phoneNumber}, current conversation: ${user.conversationSid}`
          );

          // Keep the conversation that matches user.conversationSid, delete others
          for (const convo of conversations) {
            if (convo.sid !== user.conversationSid) {
              try {
                console.log(
                  `Deleting duplicate conversation ${convo.sid} for ${phoneNumber}`
                );
                await client.conversations.v1.conversations(convo.sid).remove();
                removedCount++;
              } catch (err) {
                console.error(
                  `Error deleting conversation ${convo.sid}:`,
                  err.message
                );
              }
            } else {
              console.log(
                `Keeping conversation ${convo.sid} for ${phoneNumber}`
              );
            }
          }
        } else {
          console.log(
            `No user found for ${phoneNumber}, keeping most recent conversation`
          );

          // No user found, keep the most recent conversation and delete others
          // Sort by dateCreated (recent first)
          conversations.sort(
            (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
          );

          // Delete all but the most recent
          for (let i = 1; i < conversations.length; i++) {
            try {
              console.log(
                `Deleting old conversation ${conversations[i].sid} for ${phoneNumber}`
              );
              await client.conversations.v1
                .conversations(conversations[i].sid)
                .remove();
              removedCount++;
            } catch (err) {
              console.error(
                `Error deleting conversation ${conversations[i].sid}:`,
                err.message
              );
            }
          }
        }
      }
    }

    console.log(
      `Cleanup complete. Removed ${removedCount} duplicate conversations/users.`
    );
    return removedCount;
  } catch (error) {
    console.error("Error during cleanup:", error);
    return 0;
  }
}

module.exports = {
  sendMessage,
  sendRichMessage,
  createConversation,
  addParticipant,
  createTwimlResponse,
  configureConversationService,
  resetConversation,
  findConversationsForUser,
  getMediaContent,
  cleanupDuplicateWebhooks,
};
