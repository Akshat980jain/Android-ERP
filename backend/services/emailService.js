const fs = require('fs');
const path = require('path');

// Check if Brevo email service is properly configured
const isConfigured = !!process.env.BREVO_API_KEY;

// Sender configuration
const defaultSender = {
    name: process.env.EMAIL_FROM_NAME || 'EduConnect',
    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || 'noreply@educonnect.com'
};

if (!isConfigured) {
    console.warn('⚠️ Brevo email service not configured. Set BREVO_API_KEY in .env');
    console.warn('📧 Emails will be logged to console in dev mode.');
} else {
    console.log('✅ Brevo HTTP API configured');
    console.log('   Sender:', defaultSender.email);
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
 * Send an email using Brevo HTTP API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Name of the template to use
 * @param {object} data - Data to inject into the template
 * @returns {Promise<object>} Result of sending
 */
const sendEmail = async (to, subject, templateName, data = {}) => {
    try {
        const html = loadTemplate(templateName, data);
        const textContent = data.message || subject;

        if (!isConfigured) {
            console.log('📧 [DEV MODE] Email would be sent:');
            console.log('  To:', to);
            console.log('  Subject:', subject);
            console.log('  Template:', templateName);
            console.log('  Data:', JSON.stringify(data, null, 2));
            return { success: true, messageId: 'dev-mode-' + Date.now(), devMode: true };
        }

        // Use Brevo HTTP API directly
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: defaultSender,
                to: [{ email: to }],
                subject: subject,
                htmlContent: html || `<p>${JSON.stringify(data)}</p>`,
                textContent: textContent
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Email sent successfully via Brevo:', result.messageId);
            return { success: true, messageId: result.messageId };
        } else {
            console.error('❌ Brevo API error:', result);
            return { success: false, error: result.message || 'Brevo API error' };
        }
    } catch (error) {
        console.error('❌ Error sending email via Brevo:', error.message);
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
            message: 'Brevo email service not configured. Set BREVO_API_KEY in .env'
        };
    }

    try {
        // Send test email if TEST_EMAIL is configured
        const testEmail = process.env.TEST_EMAIL;
        if (testEmail) {
            const result = await sendEmail(
                testEmail,
                'EduConnect Email Test',
                'test',
                { name: 'Admin', testMessage: 'This is a test email from EduConnect via Brevo.' }
            );
            return {
                success: result.success,
                message: result.success ? 'Brevo HTTP API verified and test email sent' : 'Test email failed: ' + result.error,
                result
            };
        }

        return {
            success: true,
            message: 'Brevo HTTP API is configured (API key present)'
        };
    } catch (error) {
        return {
            success: false,
            message: `Brevo HTTP API verification failed: ${error.message}`
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
