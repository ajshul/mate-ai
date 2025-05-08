#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const dotenv = require("dotenv");
const os = require("os");

// Load environment variables
dotenv.config();

const ENV_FILE_PATH = path.join(__dirname, "..", ".env");
const VOICE_SERVER_PATH = path.join(
  __dirname,
  "..",
  "src",
  "voice-call-server"
);
const NGROK_CONFIG_PATH = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "ngrok",
  "ngrok.yml"
);

// Fixed tunnel names
const VOICE_TUNNEL_NAME = "voice";
const TEXT_TUNNEL_NAME = "text";

console.log(`
📋 Mate AI Setup Checker
------------------------
`);

// Check if .env file exists
let envFileExists = false;
try {
  if (fs.existsSync(ENV_FILE_PATH)) {
    envFileExists = true;
    console.log("✅ .env file exists");
  } else {
    console.log("❌ .env file is missing");
    console.log("   Create a .env file based on env.sample");
  }
} catch (err) {
  console.error("Error checking .env file:", err);
}

// Check required environment variables
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
];

const voiceCallEnvVars = ["VOICE_CALL_PORT", "VOICE_CALL_PUBLIC_URL"];
const textAppEnvVars = ["BASE_URL", "WEBHOOK_URL"];

if (envFileExists) {
  console.log("\n🔑 Checking environment variables:");

  requiredEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing`);
    }
  });

  console.log("\n🔈 Checking voice call environment variables:");

  voiceCallEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing`);
    }
  });

  console.log("\n📱 Checking text app environment variables:");

  textAppEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing`);
    }
  });
}

// Check if node_modules exist in main project and voice-call-server
console.log("\n📦 Checking dependencies:");

const mainNodeModulesPath = path.join(__dirname, "..", "node_modules");
const voiceNodeModulesPath = path.join(VOICE_SERVER_PATH, "node_modules");

if (fs.existsSync(mainNodeModulesPath)) {
  console.log("✅ Main project dependencies installed");
} else {
  console.log("❌ Main project dependencies missing - run npm install");
}

if (fs.existsSync(voiceNodeModulesPath)) {
  console.log("✅ Voice call server dependencies installed");
} else {
  console.log(
    "❌ Voice call server dependencies missing - run npm install in src/voice-call-server"
  );
}

// Check if ngrok is installed and configured
console.log("\n🌐 Checking ngrok:");
let ngrokInstalled = false;
try {
  execSync("ngrok --version", { stdio: "ignore" });
  console.log("✅ ngrok is installed");
  ngrokInstalled = true;
} catch (error) {
  console.log("❌ ngrok is not installed or not in PATH");
  console.log("   Download from https://ngrok.com/download");
}

// Check ngrok config file
if (ngrokInstalled) {
  if (fs.existsSync(NGROK_CONFIG_PATH)) {
    console.log("✅ ngrok config file exists");

    try {
      const configContent = fs.readFileSync(NGROK_CONFIG_PATH, "utf8");
      if (configContent.includes("tunnels:")) {
        console.log("✅ ngrok config contains tunnels section");

        const voicePort = process.env.VOICE_CALL_PORT || 8081;
        const mainPort = process.env.PORT || 3000;

        // Check for voice tunnel
        if (
          configContent.includes(VOICE_TUNNEL_NAME) &&
          configContent.includes(`addr: ${voicePort}`)
        ) {
          console.log(
            `✅ ngrok config has "${VOICE_TUNNEL_NAME}" tunnel for voice call server (port ${voicePort})`
          );
        } else {
          console.log(
            `❌ ngrok config missing "${VOICE_TUNNEL_NAME}" tunnel for voice call server (port ${voicePort})`
          );
          console.log("   Run 'npm run ngrok' to configure it");
        }

        // Check for text tunnel
        if (
          configContent.includes(TEXT_TUNNEL_NAME) &&
          configContent.includes(`addr: ${mainPort}`)
        ) {
          console.log(
            `✅ ngrok config has "${TEXT_TUNNEL_NAME}" tunnel for main app (port ${mainPort})`
          );
        } else {
          console.log(
            `❌ ngrok config missing "${TEXT_TUNNEL_NAME}" tunnel for main app (port ${mainPort})`
          );
          console.log("   Run 'npm run ngrok' to configure it");
        }
      } else {
        console.log("❌ ngrok config missing tunnels section");
        console.log("   Run 'npm run ngrok' to configure it");
      }
    } catch (error) {
      console.log("❌ Error reading ngrok config:", error.message);
    }
  } else {
    console.log("❌ ngrok config file not found");
    console.log(`   Expected at: ${NGROK_CONFIG_PATH}`);
    console.log("   Run 'npm run ngrok' to generate it");
  }
}

// Check MongoDB connection
console.log("\n🗃️  Checking MongoDB:");
try {
  execSync("mongod --version", { stdio: "ignore" });
  console.log("✅ MongoDB is installed");
} catch (error) {
  console.log("❌ MongoDB is not installed or not in PATH");
}

console.log(`
------------------------
🚀 Ready to launch? Run one of these commands:

   Development with all services and ngrok:
   > npm run dev:full:ngrok

   Development without ngrok:
   > npm run dev:full

   Production:
   > npm start
   
💡 Note for ngrok Free Plan users:
   The free tier allows only one agent session at a time.
   Our setup uses named tunnels ("${VOICE_TUNNEL_NAME}" and "${TEXT_TUNNEL_NAME}") to handle this limitation.
`);
