const { ValidationError } = require('../middleware/errorHandler');
const { sendLessonAssignmentEmail } = require('../utils/email');

// In-memory storage for lessons (in a real app, this would be a database)
const lessons = new Map();

class Lesson {
  constructor(name, description, imagePath, dateTime, duration) {
    this.id = Date.now().toString();
    this.name = name;
    this.description = description;
    this.imagePath = imagePath;
    this.dateTime = new Date(dateTime);
    this.duration = duration;
    this.assignedRider = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async create(lessonData) {
    const { name, description, imagePath, dateTime, duration } = lessonData;

    // Validate required fields
    if (!name || !dateTime || !duration) {
      throw new ValidationError('Name, date/time, and duration are required');
    }

    // Validate date is not in the past
    if (new Date(dateTime) < new Date()) {
      throw new ValidationError('Lesson date cannot be in the past');
    }

    // Create new lesson
    const lesson = new Lesson(name, description, imagePath, dateTime, duration);
    lessons.set(lesson.id, lesson);

    return lesson;
  }

  static async update(id, updateData) {
    const lesson = lessons.get(id);
    if (!lesson) {
      throw new ValidationError('Lesson not found');
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'imagePath', 'dateTime', 'duration'];
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'dateTime') {
          // Validate new date is not in the past
          if (new Date(value) < new Date()) {
            throw new ValidationError('Lesson date cannot be in the past');
          }
          lesson[key] = new Date(value);
        } else {
          lesson[key] = value;
        }
      }
    }

    lesson.updatedAt = new Date();
    lessons.set(id, lesson);

    return lesson;
  }

  static async assignRider(lessonId, username, email) {
    const lesson = lessons.get(lessonId);
    if (!lesson) {
      throw new ValidationError('Lesson not found');
    }

    // Check if lesson is already assigned
    if (lesson.assignedRider) {
      throw new ValidationError('Lesson is already assigned to a rider');
    }

    // Assign rider
    lesson.assignedRider = username;
    lesson.updatedAt = new Date();
    lessons.set(lessonId, lesson);

    // Send email notification
    try {
      await sendLessonAssignmentEmail(email, lesson);
    } catch (error) {
      console.error('Failed to send lesson assignment email:', error);
      // Continue with assignment even if email fails
    }

    return lesson;
  }

  static async unassignRider(lessonId) {
    const lesson = lessons.get(lessonId);
    if (!lesson) {
      throw new ValidationError('Lesson not found');
    }

    lesson.assignedRider = null;
    lesson.updatedAt = new Date();
    lessons.set(lessonId, lesson);

    return lesson;
  }

  static async getById(id) {
    const lesson = lessons.get(id);
    if (!lesson) {
      throw new ValidationError('Lesson not found');
    }
    return lesson;
  }

  static async getAll() {
    return Array.from(lessons.values());
  }

  static async getRiderLessons(username) {
    return Array.from(lessons.values()).filter(
      lesson => lesson.assignedRider === username
    );
  }

  // Get lessons within a date range
  static async getRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    return Array.from(lessons.values()).filter(lesson => {
      const lessonDate = new Date(lesson.dateTime);
      return lessonDate >= startDate && lessonDate <= endDate;
    });
  }

  // Delete a lesson
  static async delete(id) {
    const lesson = lessons.get(id);
    if (!lesson) {
      throw new ValidationError('Lesson not found');
    }

    // Check if lesson is in the past
    if (new Date(lesson.dateTime) < new Date()) {
      throw new ValidationError('Cannot delete past lessons');
    }

    lessons.delete(id);
    return { message: 'Lesson deleted successfully' };
  }
}

module.exports = Lesson;
