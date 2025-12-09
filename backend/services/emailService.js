const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email configuration
const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
};

// Check if email service is properly configured
const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

// Create transporter
let transporter;
if (isConfigured) {
    transporter = nodemailer.createTransport(emailConfig);
} else {
    console.warn('⚠️ Email service not configured. Emails will be logged to console.');
}

/**
 * Load and compile an HTML template with data
 * @param {string} templateName - Name of the template file (without .html)
 * @param {object} data - Data to inject into the template
 * @returns {string} Compiled HTML
 */
const loadTemplate = (templateName, data = {}) => {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
        console.warn(`Template '${templateName}' not found, using plain text fallback`);
        return null;
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Add default data
    const defaultData = {
        institutionName: 'EduConnect',
        currentYear: new Date().getFullYear(),
        clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    };

    const allData = { ...defaultData, ...data };

    // Replace placeholders {{variable}} with actual values
    Object.keys(allData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, allData[key] || '');
    });

    return html;
};

/**
 * Send an email using a template
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Name of the template to use
 * @param {object} data - Data to inject into the template
 * @returns {Promise<object>} Result of sending
 */
const sendEmail = async (to, subject, templateName, data = {}) => {
    try {
        const html = loadTemplate(templateName, data);

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html: html || `<p>${JSON.stringify(data)}</p>`,
            text: data.message || subject // Fallback plain text
        };

        if (!isConfigured || !transporter) {
            console.log('📧 [DEV MODE] Email would be sent:');
            console.log('  To:', to);
            console.log('  Subject:', subject);
            console.log('  Template:', templateName);
            console.log('  Data:', JSON.stringify(data, null, 2));
            return { success: true, messageId: 'dev-mode-' + Date.now(), devMode: true };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send bulk emails to multiple users
 * @param {Array} users - Array of user objects with email and name properties
 * @param {string} subject - Email subject
 * @param {string} templateName - Name of the template to use
 * @param {object} data - Base data to inject into the template
 * @returns {Promise<Array>} Results of sending
 */
const sendBulkEmail = async (users, subject, templateName, data = {}) => {
    const results = [];

    for (const user of users) {
        const userData = {
            ...data,
            name: user.firstName || user.name || 'User',
            email: user.email
        };

        const result = await sendEmail(user.email, subject, templateName, userData);
        results.push({
            email: user.email,
            ...result
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
};

/**
 * Send a general notification email
 * @param {object} user - User object with email and name
 * @param {object} notification - Notification data (title, message, category, actionUrl)
 * @returns {Promise<object>} Result of sending
 */
const sendGeneralNotification = async (user, notification) => {
    const data = {
        name: user.firstName || user.name || 'User',
        title: notification.title,
        message: notification.message,
        category: notification.category || 'general',
        actionUrl: notification.actionUrl || process.env.CLIENT_URL || 'http://localhost:5173'
    };

    return sendEmail(
        user.email,
        notification.title,
        'general-notification',
        data
    );
};

/**
 * Send password reset email
 * @param {object} user - User object
 * @param {string} resetToken - Password reset token
 * @returns {Promise<object>} Result of sending
 */
const sendPasswordResetEmail = async (user, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const data = {
        name: user.firstName || user.name || 'User',
        resetUrl,
        expiryMinutes: 60
    };

    return sendEmail(
        user.email,
        'Password Reset Request',
        'password-reset',
        data
    );
};

/**
 * Send welcome email to new user
 * @param {object} user - User object
 * @returns {Promise<object>} Result of sending
 */
const sendWelcomeEmail = async (user) => {
    const data = {
        name: user.firstName || user.name || 'User',
        email: user.email,
        loginUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    };

    return sendEmail(
        user.email,
        'Welcome to EduConnect',
        'welcome',
        data
    );
};

/**
 * Test the email service configuration
 * @returns {Promise<object>} Test result
 */
const testEmailService = async () => {
    if (!isConfigured) {
        return {
            success: false,
            message: 'Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env'
        };
    }

    try {
        await transporter.verify();

        // Send test email if TEST_EMAIL is configured
        const testEmail = process.env.TEST_EMAIL;
        if (testEmail) {
            const result = await sendEmail(
                testEmail,
                'EduConnect Email Test',
                'test',
                { name: 'Admin', testMessage: 'This is a test email from EduConnect.' }
            );
            return {
                success: true,
                message: 'Email service verified and test email sent',
                result
            };
        }

        return {
            success: true,
            message: 'Email service verified successfully'
        };
    } catch (error) {
        return {
            success: false,
            message: `Email service verification failed: ${error.message}`
        };
    }
};

module.exports = {
    sendEmail,
    sendBulkEmail,
    sendGeneralNotification,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    testEmailService,
    isConfigured,
    loadTemplate
};
