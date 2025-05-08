const express = require("express");
const router = express.Router();
const axios = require("axios");
const twilio = require("twilio");

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Get Twilio credentials status
router.get("/twilio", (req, res) => {
  const credentialsSet = Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  );
  res.json({ credentialsSet });
});

// Get Twilio phone numbers
router.get("/twilio/numbers", async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(500).json({ error: "Twilio client not initialized" });
    }

    const incomingPhoneNumbers = await twilioClient.incomingPhoneNumbers.list({
      limit: 20,
    });
    res.json(incomingPhoneNumbers);
  } catch (error) {
    console.error("Error fetching Twilio numbers:", error);
    res.status(500).json({ error: "Failed to fetch Twilio numbers" });
  }
});

// Update Twilio phone number webhook
router.post("/twilio/numbers", async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(500).json({ error: "Twilio client not initialized" });
    }

    const { phoneNumberSid, voiceUrl } = req.body;

    if (!phoneNumberSid || !voiceUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const incomingPhoneNumber = await twilioClient
      .incomingPhoneNumbers(phoneNumberSid)
      .update({ voiceUrl });

    res.json(incomingPhoneNumber);
  } catch (error) {
    console.error("Error updating Twilio number:", error);
    res.status(500).json({ error: "Failed to update Twilio number" });
  }
});

// Check server status and get public URL
router.get("/server-status", async (req, res) => {
  try {
    // Try to reach the voice call server
    const serverResponse = await axios.get("http://localhost:8081/public-url", {
      timeout: 2000,
    });

    if (serverResponse.status === 200) {
      res.json({
        serverUp: true,
        publicUrl: serverResponse.data.publicUrl || "",
      });
    } else {
      res.json({ serverUp: false, publicUrl: "" });
    }
  } catch (error) {
    console.error("Failed to check server status:", error);
    res.json({ serverUp: false, publicUrl: "" });
  }
});

// Check if ngrok URL is accessible
router.post("/check-ngrok", async (req, res) => {
  try {
    const { publicUrl } = req.body;

    if (!publicUrl) {
      return res.status(400).json({ error: "Missing public URL" });
    }

    let accessible = false;

    try {
      // Try to access the public URL
      const response = await axios.get(`${publicUrl}/public-url`, {
        timeout: 5000,
      });

      accessible = response.status === 200;
    } catch (error) {
      console.error("Error checking ngrok URL:", error);
      accessible = false;
    }

    res.json({ accessible });
  } catch (error) {
    console.error("Failed to check ngrok URL:", error);
    res.status(500).json({ error: "Failed to check ngrok URL" });
  }
});

module.exports = router;
