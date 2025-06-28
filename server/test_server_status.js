const http = require('http');

// Test HTTP server
console.log('Testing HTTP server...');
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/',
  method: 'GET'
}, (res) => {
  console.log('HTTP server status:', res.statusCode);
  res.on('data', (chunk) => {
    console.log('HTTP response:', chunk.toString());
  });
});

req.on('error', (err) => {
  console.error('HTTP server error:', err.message);
});

req.end();

// Test WebSocket status endpoint
console.log('\nTesting WebSocket status endpoint...');
const wsReq = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/websocket/status',
  method: 'GET'
}, (res) => {
  console.log('WebSocket status endpoint status:', res.statusCode);
  res.on('data', (chunk) => {
    console.log('WebSocket status response:', chunk.toString());
  });
});

wsReq.on('error', (err) => {
  console.error('WebSocket status endpoint error:', err.message);
});

wsReq.end(); 