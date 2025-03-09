const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { ValidationError } = require('../middleware/errorHandler');
const Lesson = require('../models/lesson');

const router = express.Router();

// Helper function to convert lesson to calendar event format
const lessonToEvent = (lesson) => ({
  id: lesson.id,
  title: lesson.name,
  start: `${lesson.date.toISOString().split('T')[0]}T${lesson.time}`,
  end: (() => {
    const startTime = new Date(`${lesson.date.toISOString().split('T')[0]}T${lesson.time}`);
    const endTime = new Date(startTime.getTime() + lesson.duration * 60000);
    return endTime.toISOString();
  })(),
  description: lesson.description,
  imagePath: lesson.imagePath,
  duration: lesson.duration,
  assignedRiders: Array.from(lesson.assignedRiders),
  extendedProps: {
    duration: lesson.duration,
    assignedRiders: Array.from(lesson.assignedRiders)
  }
});

// Get all calendar events
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let lessons;
    
    if (req.user.role === 'admin') {
      // Admin sees all lessons
      lessons = await Lesson.getAll();
    } else {
      // Riders see only their assigned lessons
      lessons = await Lesson.getLessonsForRider(req.user.username);
    }

    // Convert lessons to calendar events
    const events = lessons.map(lessonToEvent);
    
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Update event time (drag & drop)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { start, end } = req.body;
    
    if (!start || !end) {
      throw new ValidationError('Start and end times are required');
    }

    // Extract date and time from the start datetime
    const startDate = new Date(start);
    const startTime = startDate.toTimeString().slice(0, 5); // HH:MM format
    
    // Calculate duration in minutes
    const duration = Math.round((new Date(end) - startDate) / (60 * 1000));

    // Check for scheduling conflicts
    const hasConflict = await Lesson.checkScheduleConflict(
      startDate.toISOString().split('T')[0],
      startTime,
      duration,
      req.params.id
    );

    if (hasConflict) {
      throw new ValidationError('Time slot conflicts with an existing lesson');
    }

    // Update the lesson
    const updatedLesson = await Lesson.update(req.params.id, {
      date: startDate.toISOString().split('T')[0],
      time: startTime,
      duration
    });

    // Convert to calendar event format
    const event = lessonToEvent(updatedLesson);
    
    res.json(event);
  } catch (error) {
    next(error);
  }
});

// Get events for a specific date range
router.get('/range', authMiddleware, async (req, res, next) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      throw new ValidationError('Start and end dates are required');
    }

    let lessons;
    
    if (req.user.role === 'admin') {
      lessons = await Lesson.getAll();
    } else {
      lessons = await Lesson.getLessonsForRider(req.user.username);
    }

    // Filter lessons within the date range
    const filteredLessons = lessons.filter(lesson => {
      const lessonDate = new Date(`${lesson.date.toISOString().split('T')[0]}T${lesson.time}`);
      return lessonDate >= new Date(start) && lessonDate <= new Date(end);
    });

    // Convert to calendar events
    const events = filteredLessons.map(lessonToEvent);
    
    res.json(events);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
