#!/usr/bin/env node

const { execSync, spawn, exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create readline interface for user prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility to prompt for confirmation
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Check if MongoDB is accessible by trying to connect to it
function isMongoDBAccessible() {
  try {
    // Try to connect to MongoDB using mongo shell
    execSync('mongosh --eval "db.version()" --quiet', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Wait for MongoDB to become accessible with a timeout
async function waitForMongoDB(timeoutMs = 10000) {
  console.log('⏳ Waiting for MongoDB to be accessible...');
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (isMongoDBAccessible()) {
      console.log('✅ MongoDB is now accessible!');
      return true;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.error('⏱️ Timed out waiting for MongoDB to become accessible');
  return false;
}

// Check if a process is running
function isProcessRunning(processName) {
  try {
    const output = execSync(`pgrep -f "${processName}"`, { stdio: 'pipe' }).toString();
    return output.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Kill a process if it's running
async function killProcess(processName, friendlyName) {
  if (isProcessRunning(processName)) {
    console.log(`⚠️  ${friendlyName} is already running.`);
    const shouldKill = await confirm(`   Do you want to kill the existing ${friendlyName} process?`);
    
    if (shouldKill) {
      try {
        execSync(`pkill -f "${processName}"`);
        console.log(`✅ Stopped existing ${friendlyName} process.`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to kill ${friendlyName}: ${error.message}`);
        return false;
      }
    } else {
      console.log(`ℹ️  Continuing with existing ${friendlyName} process.`);
      return true;
    }
  }
  return true; // No process to kill, so we're good
}

// Start MongoDB if not running
// Start MongoDB if not running
async function ensureMongoDBRunning() {
  console.log('🔍 Checking MongoDB status...');
  
  // First check if MongoDB is already accessible
  if (isMongoDBAccessible()) {
    console.log('✅ MongoDB is already running and accessible.');
    return true;
  }
  
  // Check if MongoDB is installed
  try {
    const brewOutput = execSync('brew list | grep mongodb').toString();
    
    // MongoDB is installed but not running, try to start it
    console.log('⚠️ MongoDB is installed but not running.');
    const shouldStart = await confirm('   Would you like to start MongoDB?');
    
    if (shouldStart) {
      // Try first with brew services
      try {
        console.log('🚀 Starting MongoDB via brew services...');
        execSync('brew services start mongodb-community@6.0', { stdio: 'inherit' });
        
        // Wait for MongoDB to become accessible
        const success = await waitForMongoDB(15000);
        if (success) {
          return true;
        }
        
        // If service started but MongoDB isn't accessible, try direct method
        console.log('⚠️ MongoDB service started but not accessible. Trying direct method...');
      } catch (error) {
        console.error('❌ Failed to start MongoDB service:', error.message);
      }
      
      // Try direct approach 
      console.log('🔄 Trying to start MongoDB directly...');
      const shouldStartDirect = await confirm('   Would you like to try starting MongoDB directly?');
      
      if (shouldStartDirect) {
        try {
          // Create data directory if it doesn't exist
          execSync(`mkdir -p ~/data/db`, { stdio: 'inherit' });
          
          console.log('🚀 Starting MongoDB directly with mongod...');
          
          // Start MongoDB in background
          const mongodProcess = spawn('mongod', ['--dbpath', `${process.env.HOME}/data/db`], {
            detached: true,
            stdio: 'inherit'  // Show output for better debugging
          });
          
          // Wait for MongoDB to become accessible
          const success = await waitForMongoDB(20000);
          if (success) {
            mongodProcess.unref();  // Detach from parent process after success
            return true;
          }
          
          // If we reach here, MongoDB didn't start properly
          console.error('❌ MongoDB didn\'t start successfully.');
          return false;
        } catch (directError) {
          console.error('❌ Failed to start MongoDB directly:', directError.message);
          return false;
        }
      } else {
        console.log('⚠️ Continuing without MongoDB. The application may not work correctly.');
        return false;
      }
    } else {
      console.log('⚠️ Continuing without MongoDB. The application may not work correctly.');
      return false;
    }
  } catch (error) {
    // MongoDB is not installed
    console.error('❌ MongoDB appears to not be installed:', error.message);
    const shouldInstall = await confirm('   Would you like to install MongoDB?');
    
    if (shouldInstall) {
      try {
        console.log('🔄 Installing MongoDB...');
        execSync('brew tap mongodb/brew', { stdio: 'inherit' });
        execSync('brew install mongodb-community@6.0', { stdio: 'inherit' });
        console.log('✅ MongoDB installed. Starting service...');
        execSync('brew services start mongodb-community@6.0', { stdio: 'inherit' });
        
        // Wait for MongoDB to become accessible
        const success = await waitForMongoDB(20000);
        if (success) {
          return true;
        }
        
        console.error('❌ MongoDB installation completed but service is not accessible.');
        return false;
      } catch (installError) {
        console.error('❌ Failed to install MongoDB:', installError.message);
        return false;
      }
    } else {
      console.log('⚠️ Continuing without MongoDB. The application may not work correctly.');
      return false;
    }
  }
}
// Start and prepare ngrok
async function ensureNgrokRunning() {
  await killProcess('ngrok', 'ngrok');
  
  console.log('🚀 Starting ngrok in background...');
  
  try {
    const ngrokProcess = spawn('node', ['scripts/start-all-tunnels.js'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Wait for ngrok to start and update URLs
    return new Promise((resolve) => {
      let outputData = '';
      
      ngrokProcess.stdout.on('data', (data) => {
        const output = data.toString();
        outputData += output;
        process.stdout.write(output);
        
        // Check if ngrok is ready
        if (output.includes('Updated Twilio Conversations Global webhook')) {
          console.log('✅ ngrok setup complete and webhooks configured.');
          resolve(true);
        }
      });
      
      ngrokProcess.stderr.on('data', (data) => {
        console.error(`ngrok stderr: ${data}`);
      });
      
      // Set a 30-second timeout in case the expected output never appears
      setTimeout(() => {
        if (!outputData.includes('Updated Twilio Conversations Global webhook')) {
          console.log('⚠️  ngrok might not be fully configured, but continuing anyway.');
          resolve(true);
        }
      }, 30000);
      
      ngrokProcess.on('error', (error) => {
        console.error('❌ Failed to start ngrok:', error.message);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start ngrok:', error.message);
    return false;
  }
}

// Start the main application
function startApplication() {
  console.log('🚀 Starting the application...');
  
  // Construct the command to start everything except ngrok
  const concurrentlyCmd = 'concurrently "npm run dev" "npm run client" "npm run voice"';
  
  // Execute the command in the current terminal (replacing the current process)
  const child = spawn(concurrentlyCmd, {
    stdio: 'inherit',
    shell: true
  });
  
  // Forward SIGINT (Ctrl+C) to the child process
  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });
  
  // Exit when the child exits
  child.on('exit', (code) => {
    console.log(`\n📋 Application exited with code ${code}`);
    process.exit(code);
  });
}

// Main function
async function main() {
  console.log('\n🚀 Setting up development environment for Mate AI...\n');
  
  // Check for active processes that might interfere
  await killProcess('concurrently.*npm run dev', 'Development server');
  
  // Ensure MongoDB is running
  const mongoReady = await ensureMongoDBRunning();
  if (!mongoReady) {
    console.log('⚠️  MongoDB setup incomplete. The application may not function correctly.');
    const shouldContinue = await confirm('   Do you want to continue anyway?');
    if (!shouldContinue) {
      console.log('❌ Setup canceled by user.');
      rl.close();
      process.exit(1);
    }
  }
  
  // Ensure ngrok is running with appropriate tunnels
  const ngrokReady = await ensureNgrokRunning();
  if (!ngrokReady) {
    console.log('⚠️  ngrok setup incomplete. Voice calls and webhooks may not function correctly.');
    const shouldContinue = await confirm('   Do you want to continue anyway?');
    if (!shouldContinue) {
      console.log('❌ Setup canceled by user.');
      rl.close();
      process.exit(1);
    }
  }
  
  // Confirmation before starting
  console.log('\n✅ Environment setup complete!');
  const shouldStart = await confirm('   Start the application now?');
  
  if (shouldStart) {
    rl.close();
    startApplication();
  } else {
    console.log('❌ Application startup canceled by user.');
    rl.close();
    process.exit(0);
  }
}

// Run the main function
main();
