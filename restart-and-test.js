const { exec } = require('child_process');
const fs = require('fs');

console.log('🔄 Restarting backend server...');

// Kill existing Node.js processes
exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️  Could not kill existing processes:', error.message);
  } else {
    console.log('✅ Killed existing Node.js processes');
  }
  
  // Wait a moment
  setTimeout(() => {
    console.log('🚀 Starting backend server...');
    
    // Start the server
    const serverProcess = exec('node server.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error starting server:', error);
        return;
      }
    });
    
    // Show server output
    serverProcess.stdout.on('data', (data) => {
      console.log('Server:', data.toString());
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });
    
    console.log('✅ Backend server started with PID:', serverProcess.pid);
    console.log('🔍 Now test the sub-forwarder dashboard!');
    
  }, 2000);
});
