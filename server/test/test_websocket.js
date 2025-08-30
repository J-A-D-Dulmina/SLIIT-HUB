const WebSocket = require('ws');

console.log('Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:5000');

ws.on('open', () => {
  console.log('WebSocket connection opened successfully');
  ws.close();
});

ws.on('message', (data) => {
  console.log('Received message:', data.toString());
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('WebSocket closed. Code:', code, 'Reason:', reason);
  process.exit(0);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('Test timeout - WebSocket server may not be running');
  process.exit(1);
}, 5000);

// Test HTTP server
const http = require('http');

console.log('\n=== WebSocket Server Test ===\n');

console.log('Testing HTTP server at http://localhost:5000...');
const req = http.request('http://localhost:5000', (res) => {
  if (res.statusCode === 200) {
    console.log('HTTP server is running!');
  } else {
    console.log('HTTP server responded with status:', res.statusCode);
  }
});

req.on('error', (error) => {
  console.log('HTTP server error:', error.message);
});

req.end(); 