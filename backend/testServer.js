const express = require('express');
const cors = require('cors');

const app = express();

// Basic CORS
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Login test route
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({ 
    success: true, 
    message: 'Test login response',
    token: 'test-token',
    user: { name: 'Test User', email: 'test@example.com', role: 'admin' }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 