const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// HTML template for the credentials email
const getEmailTemplate = (userType, email, password, senderName = 'Literexia Admin', senderEmail = '') => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a2035;">Welcome to Literexia</h2>
            <p>Hello,</p>
            <p>Your ${userType} account has been created successfully by ${senderName}. Here are your login credentials:</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
            </div>

            <p>For security reasons, we recommend changing your password after your first login.</p>

            <p style="color: #666;">If you have any questions about your account, please contact ${senderName} at ${senderEmail}.</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
                <p><strong>Note:</strong> This email was sent from our system account. To contact the administrator who created your account, please reply to this email or send a message to ${senderEmail}.</p>
                <p>Account created by: ${senderName} (${senderEmail})</p>
            </div>
        </div>
    `;
};

// Controller function to send credentials
const sendCredentials = async (req, res) => {
    console.log('Received request to send credentials:', {
        email: req.body.email,
        userType: req.body.userType,
        adminEmail: req.body.adminEmail
    });

    try {
        const { email, password, userType, adminEmail, adminName } = req.body;

        if (!email || !password || !userType) {
            console.error('Missing required fields:', { email: !!email, password: !!password, userType: !!userType });
            return res.status(400).json({
                success: false,
                message: 'Email, password, and userType are required'
            });
        }

        // Use admin email if provided, otherwise fallback to default
        const senderEmail = adminEmail && adminEmail.trim() ? adminEmail.trim() : process.env.EMAIL_USER;
        const senderName = adminName && adminName.trim() ? adminName.trim() : 'Literexia Admin';

        // Log email configuration (without sensitive data)
        console.log('Using email configuration:', {
            from: `Literexia System <${process.env.EMAIL_USER}>`,
            replyTo: `${senderName} <${senderEmail}>`,
            to: email,
            subject: `Your Literexia ${userType} Account Credentials`
        });

        // Prepare email options
        const mailOptions = {
            from: `Literexia System <${process.env.EMAIL_USER}>`, // Use authenticated email as sender
            replyTo: `${senderName} <${senderEmail}>`, // Admin's email for replies
            to: email,
            subject: `Your Literexia ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account Credentials`,
            html: getEmailTemplate(userType, email, password, senderName, senderEmail)
        };

        // Send the email
        console.log('Attempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        res.status(200).json({
            success: true,
            message: 'Credentials sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error sending credentials:', error);
        console.error('Error details:', {
            code: error.code,
            command: error.command,
            response: error.response
        });

        res.status(500).json({
            success: false,
            message: 'Failed to send credentials email',
            error: error.message,
            details: {
                code: error.code,
                command: error.command
            }
        });
    }
};

module.exports = {
    sendCredentials
}; 