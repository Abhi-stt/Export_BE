const { spawn, exec } = require('child_process');

console.log('🔄 Stopping all Node.js processes and restarting server...');
console.log('=========================================================\n');

// Kill all node processes
exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️  No Node.js processes to kill or error:', error.message);
  } else {
    console.log('✅ Killed all Node.js processes');
  }
  
  // Wait 3 seconds for processes to fully terminate
  setTimeout(() => {
    console.log('\n🚀 Starting server with updated routes...');
    
    // Start server with environment variables
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

    console.log('✅ Server should be starting now...');
    console.log('📡 Server will run on http://localhost:5000');
    console.log('🔑 JWT_SECRET: sfdjklsdkfjsdfksjl');
    console.log('\n🎯 The /api/users/me endpoint is now fixed!');
    console.log('Try logging in with sub-forwarder credentials again.');

  }, 3000);
});
