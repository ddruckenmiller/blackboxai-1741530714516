require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const lessonRoutes = require('./routes/lessons');
const eventRoutes = require('./routes/events');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads', 'lessons');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/events', eventRoutes);

// Error handling middleware
app.use(errorHandler);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Riding School API' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
