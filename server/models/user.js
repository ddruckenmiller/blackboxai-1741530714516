const bcrypt = require('bcryptjs');
const { ValidationError } = require('../middleware/errorHandler');

// In-memory storage for users (in a real app, this would be a database)
const users = new Map();

class User {
  constructor(username, password, email, role) {
    this.id = Date.now().toString();
    this.username = username;
    this.password = password;
    this.email = email;
    this.role = role;
    this.isDefaultPassword = password === 'horse';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async create(userData) {
    const { username, password, email, role } = userData;

    // Validate required fields
    if (!username || !password || !email || !role) {
      throw new ValidationError('All fields are required');
    }

    // Check if username already exists
    if (users.has(username)) {
      throw new ValidationError('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User(username, hashedPassword, email, role);
    users.set(username, user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findByUsername(username) {
    return users.get(username);
  }

  static async updatePassword(username, newPassword) {
    const user = users.get(username);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user
    user.password = hashedPassword;
    user.isDefaultPassword = false;
    user.updatedAt = new Date();
    users.set(username, user);

    return { message: 'Password updated successfully' };
  }

  static async validatePassword(username, password) {
    const user = users.get(username);
    if (!user) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  }

  static async getAllRiders() {
    const ridersList = [];
    for (const user of users.values()) {
      if (user.role === 'rider') {
        const { password, ...riderWithoutPassword } = user;
        ridersList.push(riderWithoutPassword);
      }
    }
    return ridersList;
  }

  // Initialize admin account
  static async initializeAdmin() {
    if (!users.has('admin')) {
      await User.create({
        username: 'admin',
        password: 'admin123', // In production, use a secure password
        email: 'admin@ridingschool.com',
        role: 'admin'
      });
      console.log('Admin account initialized');
    }
  }
}

// Initialize admin account when the model is loaded
User.initializeAdmin().catch(console.error);

module.exports = User;
