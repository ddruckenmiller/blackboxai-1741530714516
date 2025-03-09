const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Function to send lesson assignment email
const sendLessonAssignmentEmail = async (riderEmail, lessonDetails) => {
  try {
    const { name, description, dateTime, duration, imagePath } = lessonDetails;
    
    // Format date and time
    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const emailContent = {
      from: `"Riding School" <${process.env.SMTP_USER}>`,
      to: riderEmail,
      subject: `New Riding Lesson Assigned: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">You have been assigned to a new riding lesson!</h2>
          ${imagePath ? `<img src="${imagePath}" alt="Lesson Image" style="max-width: 100%; height: auto; margin: 20px 0;">` : ''}
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px;">
            <p><strong>Lesson:</strong> ${name}</p>
            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; border-top: 2px solid #e2e8f0;">
            <p>Please log in to your dashboard to view more details.</p>
            <p>If you need to make any changes, please contact the administrator.</p>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #718096; text-align: center;">
            <p>This is an automated message from the Riding School Management System.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(emailContent);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email notification');
  }
};

// Function to send welcome email to new riders
const sendWelcomeEmail = async (riderEmail, username) => {
  try {
    const emailContent = {
      from: `"Riding School" <${process.env.SMTP_USER}>`,
      to: riderEmail,
      subject: 'Welcome to Riding School!',
      html: `
        <h2>Welcome to Riding School!</h2>
        <p>Hello ${username},</p>
        <p>Your account has been successfully created. You can now log in using:</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Password:</strong> horse</p>
        <p>Please change your password after your first login for security purposes.</p>
        <br>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      `
    };

    const info = await transporter.sendMail(emailContent);
    console.log('Welcome email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

module.exports = {
  sendLessonAssignmentEmail,
  sendWelcomeEmail
};
