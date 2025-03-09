const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(err.stack);

  // Default error status and message
  let status = 500;
  let message = 'Something went wrong on the server';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Invalid authentication credentials';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'You do not have permission to perform this action';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'The requested resource was not found';
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File is too large';
  }

  // Send error response
  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString()
    }
  });
};

// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

module.exports = {
  errorHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};
