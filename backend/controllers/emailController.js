const nodemailer = require('nodemailer');

// Dynamic transporter creation function
const createTransporter = (adminEmail, adminEmailPassword) => {
    // Use admin's email credentials if provided, otherwise fall back to system default
    const emailUser = adminEmail || process.env.EMAIL_USER;
    const emailPassword = adminEmailPassword || process.env.EMAIL_PASSWORD;

    console.log(`Creating transporter for: ${emailUser}`);

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPassword
        }
    });
};

// Default system transporter for fallback
const systemTransporter = createTransporter();

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
                <p>Account created by: ${senderName} (${senderEmail})</p>
                <p>Best regards,<br>The Literexia Team</p>
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
        const { email, password, userType, adminEmail, adminName, adminEmailPassword } = req.body;

        if (!email || !password || !userType) {
            console.error('Missing required fields:', { email: !!email, password: !!password, userType: !!userType });
            return res.status(400).json({
                success: false,
                message: 'Email, password, and userType are required'
            });
        }

        // Use admin email and name if provided, otherwise fallback to default
        const senderEmail = adminEmail && adminEmail.trim() ? adminEmail.trim() : process.env.EMAIL_USER;
        const senderName = adminName && adminName.trim() ? adminName.trim() : 'Literexia Admin';

        // Create dynamic transporter based on admin's credentials
        const dynamicTransporter = createTransporter(senderEmail, adminEmailPassword);

        // Verify transporter before sending
        try {
            await dynamicTransporter.verify();
            console.log(`Email transporter verified for: ${senderEmail}`);
        } catch (verifyError) {
            console.error('Email transporter verification failed:', verifyError);
            return res.status(500).json({
                success: false,
                message: 'Failed to verify email configuration. Please check your email credentials.',
                error: verifyError.message
            });
        }

        // Log email configuration (without sensitive data)
        console.log('Using email configuration:', {
            from: `${senderName} <${senderEmail}>`,
            to: email,
            subject: `Your Literexia ${userType} Account Credentials`
        });

        // Prepare email options
        const mailOptions = {
            from: `${senderName} <${senderEmail}>`, // Send directly from admin's email
            to: email,
            subject: `Your Literexia ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account Credentials`,
            html: getEmailTemplate(userType, email, password, senderName, senderEmail)
        };

        // Send the email
        console.log('Attempting to send email...');
        const info = await dynamicTransporter.sendMail(mailOptions);
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