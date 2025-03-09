const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const { authMiddleware } = require('../middleware/authMiddleware');
const { ValidationError } = require('../middleware/errorHandler');
const { sendWelcomeEmail } = require('../utils/email');

const router = express.Router();

// Validation middleware
const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required')
];

const validateNewRider = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validatePasswordChange = [
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .trim()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .not()
    .equals('horse')
    .withMessage('New password cannot be the default password')
];

// Login route
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { username, password } = req.body;

    // Validate credentials
    const user = await User.findByUsername(username);
    if (!user) {
      throw new ValidationError('Invalid credentials');
    }

    const isValidPassword = await User.validatePassword(username, password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        isDefaultPassword: user.isDefaultPassword
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info and token
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token,
      message: user.isDefaultPassword ? 'Please change your default password' : 'Login successful'
    });
  } catch (error) {
    next(error);
  }
});

// Create new rider (admin only)
router.post('/riders', authMiddleware, validateNewRider, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { username, email } = req.body;
    
    // Create rider with default password
    const rider = await User.create({
      username,
      email,
      password: 'horse', // Default password
      role: 'rider'
    });

    // Send welcome email
    await sendWelcomeEmail(email, username);

    res.status(201).json({
      message: 'Rider created successfully',
      rider
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authMiddleware, validatePasswordChange, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { currentPassword, newPassword } = req.body;
    const { username } = req.user;

    // Validate current password
    const isValidPassword = await User.validatePassword(username, currentPassword);
    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    // Update password
    await User.updatePassword(username, newPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all riders (admin only)
router.get('/riders', authMiddleware, async (req, res, next) => {
  try {
    const riders = await User.getAllRiders();
    res.json(riders);
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByUsername(req.user.username);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
