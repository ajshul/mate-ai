#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");
const os = require("os");

// Load environment variables
dotenv.config();

const VOICE_CALL_PORT = process.env.VOICE_CALL_PORT || 8081;
const MAIN_PORT = process.env.PORT || 3000;
const ENV_FILE_PATH = path.join(__dirname, "..", ".env");
const NGROK_CONFIG_PATH = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "ngrok",
  "ngrok.yml"
);

// Fixed tunnel names based on user's configuration
const VOICE_TUNNEL_NAME = "voice";
const TEXT_TUNNEL_NAME = "text";

async function isNgrokInstalled() {
  return new Promise((resolve) => {
    const ngrok = spawn("ngrok", ["--version"]);

    ngrok.on("error", () => {
      resolve(false);
    });

    ngrok.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

async function ensureNgrokConfig() {
  // Check if ngrok config directory exists
  const ngrokConfigDir = path.dirname(NGROK_CONFIG_PATH);
  if (!fs.existsSync(ngrokConfigDir)) {
    fs.mkdirSync(ngrokConfigDir, { recursive: true });
  }

  // Check if the config file exists
  let configExists = false;
  let needsUpdate = false;
  let voiceTunnelOk = false;
  let textTunnelOk = false;
  let configContent = "";

  if (fs.existsSync(NGROK_CONFIG_PATH)) {
    configExists = true;
    configContent = fs.readFileSync(NGROK_CONFIG_PATH, "utf8");

    // Check tunnels configuration
    voiceTunnelOk =
      configContent.includes("tunnels:") &&
      configContent.includes(VOICE_TUNNEL_NAME) &&
      configContent.includes(`addr: ${VOICE_CALL_PORT}`);

    textTunnelOk =
      configContent.includes("tunnels:") &&
      configContent.includes(TEXT_TUNNEL_NAME) &&
      configContent.includes(`addr: ${MAIN_PORT}`);

    if (!voiceTunnelOk || !textTunnelOk) {
      needsUpdate = true;
    }
  } else {
    needsUpdate = true;
  }

  // If no config or needs update, update it
  if (needsUpdate) {
    console.log("⚙️ Configuring ngrok for Mate AI...");

    if (configExists) {
      // Add or update the tunnels section
      if (configContent.includes("tunnels:")) {
        // Handle voice tunnel if needed
        if (!voiceTunnelOk) {
          const voiceTunnelPattern = new RegExp(
            `\\s+${VOICE_TUNNEL_NAME}:\\s*[\\s\\S]*?addr:\\s*\\d+`,
            "m"
          );
          if (voiceTunnelPattern.test(configContent)) {
            // Replace the existing voice tunnel
            configContent = configContent.replace(
              voiceTunnelPattern,
              `  ${VOICE_TUNNEL_NAME}:
    proto: http
    addr: ${VOICE_CALL_PORT}`
            );
          } else {
            // Add voice tunnel
            const tunnelsIndex = configContent.indexOf("tunnels:");
            const voiceTunnelEntry = `
  ${VOICE_TUNNEL_NAME}:
    proto: http
    addr: ${VOICE_CALL_PORT}`;

            // Insert after the tunnels: line
            const beforeTunnels = configContent.substring(0, tunnelsIndex + 8); // 8 is the length of "tunnels:"
            const afterTunnels = configContent.substring(tunnelsIndex + 8);
            configContent = beforeTunnels + voiceTunnelEntry + afterTunnels;
          }
        }

        // Handle text tunnel if needed
        if (!textTunnelOk) {
          const textTunnelPattern = new RegExp(
            `\\s+${TEXT_TUNNEL_NAME}:\\s*[\\s\\S]*?addr:\\s*\\d+`,
            "m"
          );
          if (textTunnelPattern.test(configContent)) {
            // Replace the existing text tunnel
            configContent = configContent.replace(
              textTunnelPattern,
              `  ${TEXT_TUNNEL_NAME}:
    proto: http
    addr: ${MAIN_PORT}`
            );
          } else {
            // Add text tunnel
            const tunnelsIndex = configContent.indexOf("tunnels:");
            const textTunnelEntry = `
  ${TEXT_TUNNEL_NAME}:
    proto: http
    addr: ${MAIN_PORT}`;

            // Insert after the tunnels: line
            const beforeTunnels = configContent.substring(0, tunnelsIndex + 8);
            const afterTunnels = configContent.substring(tunnelsIndex + 8);
            configContent = beforeTunnels + textTunnelEntry + afterTunnels;
          }
        }
      } else {
        // Add tunnels section with both tunnels
        configContent += `
tunnels:
  ${VOICE_TUNNEL_NAME}:
    proto: http
    addr: ${VOICE_CALL_PORT}
  ${TEXT_TUNNEL_NAME}:
    proto: http
    addr: ${MAIN_PORT}
`;
      }
    } else {
      // Create new config with both tunnels
      configContent = `version: "2"
authtoken: # Your authtoken will be added when you authenticate ngrok
tunnels:
  ${VOICE_TUNNEL_NAME}:
    proto: http
    addr: ${VOICE_CALL_PORT}
  ${TEXT_TUNNEL_NAME}:
    proto: http
    addr: ${MAIN_PORT}
`;
    }

    fs.writeFileSync(NGROK_CONFIG_PATH, configContent);
    console.log(`✅ Updated ngrok config at ${NGROK_CONFIG_PATH}`);
    console.log(
      'ℹ️ If you haven\'t authenticated ngrok yet, run "ngrok authtoken YOUR_TOKEN"'
    );
  } else {
    console.log(
      `✅ ngrok config already has both tunnels configured correctly`
    );
  }
}

async function updateEnvFile(voiceUrl, textUrl) {
  try {
    // Read the current .env file
    let envContent = "";
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
    }

    // Update VOICE_CALL_PUBLIC_URL
    if (voiceUrl) {
      const voiceRegex = /VOICE_CALL_PUBLIC_URL=.*/;
      const newVoiceVar = `VOICE_CALL_PUBLIC_URL=${voiceUrl}`;

      if (voiceRegex.test(envContent)) {
        envContent = envContent.replace(voiceRegex, newVoiceVar);
      } else {
        envContent += `\n${newVoiceVar}`;
      }
      console.log(`\n✅ Updated .env file with: ${newVoiceVar}`);
    }

    // Update BASE_URL and WEBHOOK_URL for main text app
    if (textUrl) {
      // Update BASE_URL
      const baseUrlRegex = /BASE_URL=.*/;
      const newBaseUrl = `BASE_URL=${textUrl}`;

      if (baseUrlRegex.test(envContent)) {
        envContent = envContent.replace(baseUrlRegex, newBaseUrl);
      } else {
        envContent += `\n${newBaseUrl}`;
      }
      console.log(`✅ Updated .env file with: ${newBaseUrl}`);

      // Update WEBHOOK_URL
      const webhookUrlRegex = /WEBHOOK_URL=.*/;
      const newWebhookUrl = `WEBHOOK_URL=${textUrl}/api/messages/webhook`;

      if (webhookUrlRegex.test(envContent)) {
        envContent = envContent.replace(webhookUrlRegex, newWebhookUrl);
      } else {
        envContent += `\n${newWebhookUrl}`;
      }
      console.log(`✅ Updated .env file with: ${newWebhookUrl}`);
    }

    // Write back to .env file
    fs.writeFileSync(ENV_FILE_PATH, envContent);
  } catch (error) {
    console.error("Failed to update .env file:", error);
  }
}

async function startNgrok() {
  if (!(await isNgrokInstalled())) {
    console.error(`
❌ ngrok is not installed or not in your PATH.
   
   Please install ngrok from https://ngrok.com/download
   
   After installation, run this script again.
`);
    process.exit(1);
  }

  // Ensure ngrok config is set up properly
  await ensureNgrokConfig();

  console.log(`
🚀 Starting ngrok tunnels for both text and voice applications...
   
   Press Ctrl+C to stop ngrok.
`);

  // Start both tunnels using ngrok start --all
  const ngrok = spawn("ngrok", ["start", "--all"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Handle stdio
  ngrok.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  ngrok.stderr.on("data", (data) => {
    console.error(`ngrok error: ${data}`);
  });

  // Look for the URLs in ngrok's API
  setTimeout(async () => {
    try {
      const response = await axios.get("http://localhost:4040/api/tunnels");
      const tunnels = response.data.tunnels;

      if (tunnels && tunnels.length > 0) {
        // Get the voice and text tunnels
        const voiceTunnel = tunnels.find(
          (t) => t.name === VOICE_TUNNEL_NAME && t.proto === "https"
        );
        const textTunnel = tunnels.find(
          (t) => t.name === TEXT_TUNNEL_NAME && t.proto === "https"
        );

        let voiceUrl = null;
        let textUrl = null;

        if (voiceTunnel) {
          voiceUrl = voiceTunnel.public_url;
          console.log(
            `\n✅ ngrok public URL for ${VOICE_TUNNEL_NAME}: ${voiceUrl}`
          );
        } else {
          console.log(`\n❌ Could not find tunnel for ${VOICE_TUNNEL_NAME}`);
        }

        if (textTunnel) {
          textUrl = textTunnel.public_url;
          console.log(
            `✅ ngrok public URL for ${TEXT_TUNNEL_NAME}: ${textUrl}`
          );
        } else {
          console.log(`❌ Could not find tunnel for ${TEXT_TUNNEL_NAME}`);
        }

        // Display recommended .env variables but don't update the file
        console.log("\n⚠️ Update your .env file with these values:");
        if (voiceUrl) {
          console.log(`VOICE_CALL_PUBLIC_URL=${voiceUrl}`);
        }
        if (textUrl) {
          console.log(`BASE_URL=${textUrl}`);
          console.log(`WEBHOOK_URL=${textUrl}/api/messages/webhook`);
        }

        // If we couldn't find specific tunnels, show what's available
        if (!voiceTunnel || !textTunnel) {
          console.log("\nℹ️ Available tunnels:");
          tunnels.forEach((tunnel) => {
            console.log(
              `- ${tunnel.name}: ${tunnel.public_url} (${tunnel.proto})`
            );
          });
        }
      } else {
        console.log("\n❌ No active tunnels found");
      }
    } catch (error) {
      console.error("Failed to get ngrok URLs:", error.message);
    }
  }, 3000);

  // Handle process exit
  ngrok.on("close", (code) => {
    console.log(`\nngrok process exited with code ${code}`);
  });
}

startNgrok().catch((error) => {
  console.error("Error starting ngrok:", error);
});
