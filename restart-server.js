const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting Backend Server...');
console.log('================================\n');

// Kill existing server process
const killProcess = spawn('taskkill', ['/F', '/PID', '13104'], { 
  shell: true,
  stdio: 'inherit' 
});

killProcess.on('close', (code) => {
  console.log(`✅ Killed existing server (exit code: ${code})`);
  
  // Wait a moment for the port to be released
  setTimeout(() => {
    console.log('\n🚀 Starting new server...');
    
    // Start new server with environment variables
    const serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '5000',
        MONGO_URI: 'mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export',
        JWT_SECRET: 'sfdjklsdkfjsdfksjl',
        FRONTEND_URL: 'http://localhost:3000'
      },
      stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Failed to start server:', err);
    });

    serverProcess.on('close', (code) => {
      console.log(`\n🔌 Server stopped (exit code: ${code})`);
    });

    console.log('✅ Server restarted with updated routes!');
    console.log('📡 Server running on http://localhost:5000');
    console.log('🔑 JWT_SECRET: sfdjklsdkfjsdfksjl');
    console.log('\n🎯 The /api/users/me endpoint should now work correctly!');

  }, 2000); // Wait 2 seconds
});

killProcess.on('error', (err) => {
  console.error('❌ Error killing process:', err);
});
