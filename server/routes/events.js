const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { ValidationError } = require('../middleware/errorHandler');
const Lesson = require('../models/lesson');

const router = express.Router();

// Get all events (filtered by role)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let events;
    if (req.user.role === 'admin') {
      // Admin sees all lessons as events
      events = await Lesson.getAll();
    } else {
      // Riders see only their assigned lessons
      events = await Lesson.getRiderLessons(req.user.username);
    }

    // Transform lessons into calendar events format
    const calendarEvents = events.map(lesson => ({
      id: lesson.id,
      title: lesson.name,
      description: lesson.description,
      start: lesson.dateTime,
      end: new Date(new Date(lesson.dateTime).getTime() + lesson.duration * 60000),
      allDay: false,
      extendedProps: {
        duration: lesson.duration,
        assignedRider: lesson.assignedRider,
        imagePath: lesson.imagePath
      }
    }));

    res.json(calendarEvents);
  } catch (error) {
    next(error);
  }
});

// Get events within a date range
router.get('/range', authMiddleware, async (req, res, next) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      throw new ValidationError('Start and end dates are required');
    }

    let events;
    if (req.user.role === 'admin') {
      // Admin sees all lessons within range
      events = await Lesson.getRange(start, end);
    } else {
      // Riders see only their assigned lessons within range
      const allRiderLessons = await Lesson.getRiderLessons(req.user.username);
      events = allRiderLessons.filter(lesson => {
        const lessonDate = new Date(lesson.dateTime);
        return lessonDate >= new Date(start) && lessonDate <= new Date(end);
      });
    }

    // Transform lessons into calendar events format
    const calendarEvents = events.map(lesson => ({
      id: lesson.id,
      title: lesson.name,
      description: lesson.description,
      start: lesson.dateTime,
      end: new Date(new Date(lesson.dateTime).getTime() + lesson.duration * 60000),
      allDay: false,
      extendedProps: {
        duration: lesson.duration,
        assignedRider: lesson.assignedRider,
        imagePath: lesson.imagePath
      }
    }));

    res.json(calendarEvents);
  } catch (error) {
    next(error);
  }
});

// Update event (lesson) date/time
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { dateTime } = req.body;
    
    if (!dateTime) {
      throw new ValidationError('New date and time are required');
    }

    // Verify the lesson exists
    const lesson = await Lesson.getById(req.params.id);

    // Check permissions
    if (req.user.role !== 'admin' && lesson.assignedRider !== req.user.username) {
      throw new ValidationError('You do not have permission to update this lesson');
    }

    // Validate new dateTime is not in the past
    const newDateTime = new Date(dateTime);
    if (newDateTime < new Date()) {
      throw new ValidationError('Lesson cannot be scheduled in the past');
    }

    // Update the lesson
    const updatedLesson = await Lesson.update(req.params.id, { dateTime: newDateTime });

    // Transform to calendar event format
    const calendarEvent = {
      id: updatedLesson.id,
      title: updatedLesson.name,
      description: updatedLesson.description,
      start: updatedLesson.dateTime,
      end: new Date(new Date(updatedLesson.dateTime).getTime() + updatedLesson.duration * 60000),
      allDay: false,
      extendedProps: {
        duration: updatedLesson.duration,
        assignedRider: updatedLesson.assignedRider,
        imagePath: updatedLesson.imagePath
      }
    };

    res.json(calendarEvent);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
