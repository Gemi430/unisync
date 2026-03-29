const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

const app = express();

// --- SAFE DATABASE MIGRATIONS ---
const runMigrations = require('./migrations');
runMigrations();
// ---------------------------------

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // Add this line

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes); // Add this line

// Serve uploads folder statically
app.use('/uploads', express.static('uploads'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Platform API is active.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
