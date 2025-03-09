const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { ValidationError } = require('../middleware/errorHandler');
const Lesson = require('../models/lesson');
const { sendLessonAssignmentEmail } = require('../utils/email');
const User = require('../models/user');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/lessons');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const validateLesson = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM format)'),
  body('duration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes')
];

// Create new lesson (admin only)
router.post('/', 
  authMiddleware, 
  isAdmin,
  upload.single('image'),
  validateLesson,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors.array()[0].msg);
      }

      const lessonData = {
        ...req.body,
        imagePath: req.file ? `/uploads/lessons/${req.file.filename}` : null
      };

      // Check for scheduling conflicts
      const hasConflict = await Lesson.checkScheduleConflict(
        lessonData.date,
        lessonData.time,
        lessonData.duration
      );

      if (hasConflict) {
        throw new ValidationError('Time slot conflicts with an existing lesson');
      }

      const lesson = await Lesson.create(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      next(error);
    }
});

// Update lesson (admin only)
router.put('/:id',
  authMiddleware,
  isAdmin,
  upload.single('image'),
  validateLesson,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors.array()[0].msg);
      }

      const lessonData = {
        ...req.body
      };

      if (req.file) {
        lessonData.imagePath = `/uploads/lessons/${req.file.filename}`;
      }

      // Check for scheduling conflicts
      const hasConflict = await Lesson.checkScheduleConflict(
        lessonData.date,
        lessonData.time,
        lessonData.duration,
        req.params.id
      );

      if (hasConflict) {
        throw new ValidationError('Time slot conflicts with an existing lesson');
      }

      const lesson = await Lesson.update(req.params.id, lessonData);
      res.json(lesson);
    } catch (error) {
      next(error);
    }
});

// Delete lesson (admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res, next) => {
  try {
    await Lesson.delete(req.params.id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all lessons
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const lessons = await Lesson.getAll();
    res.json(lessons);
  } catch (error) {
    next(error);
  }
});

// Get specific lesson
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const lesson = await Lesson.getById(req.params.id);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

// Assign rider to lesson (admin only)
router.post('/:id/assign', authMiddleware, isAdmin, async (req, res, next) => {
  try {
    const { riderUsername } = req.body;
    if (!riderUsername) {
      throw new ValidationError('Rider username is required');
    }

    // Verify rider exists
    const rider = await User.findByUsername(riderUsername);
    if (!rider || rider.role !== 'rider') {
      throw new ValidationError('Invalid rider username');
    }

    const lesson = await Lesson.assignRider(req.params.id, riderUsername);

    // Send email notification
    try {
      await sendLessonAssignmentEmail(rider.email, {
        name: lesson.name,
        description: lesson.description,
        date: lesson.date,
        time: lesson.time,
        duration: lesson.duration
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue with the assignment even if email fails
    }

    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

// Unassign rider from lesson (admin only)
router.post('/:id/unassign', authMiddleware, isAdmin, async (req, res, next) => {
  try {
    const { riderUsername } = req.body;
    if (!riderUsername) {
      throw new ValidationError('Rider username is required');
    }

    const lesson = await Lesson.unassignRider(req.params.id, riderUsername);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

// Get lessons for specific rider
router.get('/rider/:username', authMiddleware, async (req, res, next) => {
  try {
    // Verify access rights (admin or the rider themselves)
    if (req.user.role !== 'admin' && req.user.username !== req.params.username) {
      throw new ValidationError('Unauthorized access');
    }

    const lessons = await Lesson.getLessonsForRider(req.params.username);
    res.json(lessons);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
