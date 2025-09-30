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
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Literexia</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(59, 79, 129, 0.1); overflow: hidden;">

                <!-- Header Section -->
                <div style="background: linear-gradient(135deg, #3B4F81 0%, #2a3a65 100%); padding: 40px 30px; text-align: center;">
                    <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        <span style="font-size: 36px; font-weight: bold; color: #3B4F81;">L</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Literexia</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Reading Journey Begins Here</p>
                </div>

                <!-- Main Content -->
                <div style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #3B4F81; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Account Created Successfully! 🎉</h2>
                        <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">Your ${userType} account has been created by <strong>${senderName}</strong></p>
                    </div>

                    <!-- Credentials Box -->
                    <div style="background: linear-gradient(135deg, #3B4F81 0%, #2a3a65 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; box-shadow: 0 4px 12px rgba(59, 79, 129, 0.2);">
                        <h3 style="color: #ffffff; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">🔐 Your Login Credentials</h3>

                        <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 15px; border: 2px solid #3B4F81;">
                            <p style="margin: 0; color: #3B4F81; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Email Address</p>
                            <p style="margin: 10px 0 0 0; color: #3B4F81; font-size: 18px; font-weight: 600; word-break: break-all;">${email}</p>
                        </div>

                        <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; border: 2px solid #3B4F81;">
                            <p style="margin: 0; color: #3B4F81; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Temporary Password</p>
                            <p style="margin: 10px 0 0 0; color: #3B4F81; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f8f9fa; padding: 12px 16px; border-radius: 6px; display: inline-block; border: 1px solid #3B4F81;">${password}</p>
                        </div>
                    </div>

                    <!-- Security Notice -->
                    <div style="background-color: #f8f9fa; border: 2px solid #3B4F81; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                        <h4 style="color: #3B4F81; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">🔒 Security Recommendation</h4>
                        <p style="color: #3B4F81; margin: 0; font-size: 14px; line-height: 1.5;">For your security, please change your password after your first login</p>
                    </div>

                    <!-- Contact Information -->
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #3B4F81; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Need help? We're here for you!</p>
                        <div style="background-color: #3B4F81; border-radius: 8px; padding: 20px; display: inline-block;">
                            <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                                📧 Contact: <a href="mailto:${senderEmail}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${senderName}</a>
                            </p>
                            <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 12px; opacity: 0.9;">${senderEmail}</p>
                        </div>
                    </div>

                    <!-- Call to Action -->
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background: linear-gradient(135deg, #3B4F81 0%, #2a3a65 100%); display: inline-block; padding: 15px 30px; border-radius: 25px; box-shadow: 0 4px 12px rgba(59, 79, 129, 0.3);">
                            <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600;">Ready to start your reading journey? 📚</p>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 12px;">
                        Account created by: <strong>${senderName}</strong> (${senderEmail})
                    </p>
                    <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;">
                        <p style="color: #3B4F81; margin: 0; font-size: 14px; font-weight: 600;">Best regards,</p>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">The Literexia Team 🌟</p>
                    </div>
                    <div style="margin-top: 20px;">
                        <p style="color: #999; margin: 0; font-size: 11px;">
                            © ${new Date().getFullYear()} Literexia. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
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

        // Store original admin info for email template (even if credentials fail)
        const originalAdminEmail = adminEmail && adminEmail.trim() ? adminEmail.trim() : null;
        const originalAdminName = adminName && adminName.trim() ? adminName.trim() : 'Literexia Admin';

        // Use admin email and name if provided, otherwise fallback to default
        const senderEmail = originalAdminEmail || process.env.EMAIL_USER;
        const senderName = originalAdminName;

        // Create dynamic transporter based on admin's credentials
        const dynamicTransporter = createTransporter(senderEmail, adminEmailPassword);

        // Verify transporter before sending
        let finalTransporter = dynamicTransporter;
        let finalSenderName = senderName;
        let finalSenderEmail = senderEmail;

        try {
            await dynamicTransporter.verify();
            console.log(`Email transporter verified for: ${senderEmail}`);
        } catch (verifyError) {
            console.error('Admin email transporter verification failed:', verifyError);
            console.log('Falling back to system email credentials...');

            // Fallback to system email when admin credentials fail
            try {
                finalTransporter = createTransporter(); // Uses system .env credentials
                finalSenderName = 'Literexia System';
                finalSenderEmail = process.env.EMAIL_USER;

                await finalTransporter.verify();
                console.log(`Fallback email transporter verified for: ${finalSenderEmail}`);
            } catch (fallbackError) {
                console.error('System email transporter verification also failed:', fallbackError);

                // Provide more specific error messages based on error type
                let errorMessage = 'Failed to verify email configuration.';
                if (fallbackError.code === 'EAUTH') {
                    errorMessage = 'Email authentication failed. Please check your email credentials or enable "App Passwords" for Gmail.';
                } else if (fallbackError.code === 'ECONNECTION') {
                    errorMessage = 'Failed to connect to email server. Please check your internet connection.';
                } else if (fallbackError.code === 'ETIMEDOUT') {
                    errorMessage = 'Email server connection timed out. Please try again later.';
                }

                return res.status(500).json({
                    success: false,
                    message: errorMessage,
                    error: fallbackError.message,
                    code: fallbackError.code,
                    troubleshooting: {
                        gmail: 'For Gmail, you may need to enable 2-factor authentication and use an App Password instead of your regular password.',
                        appPassword: 'Visit https://myaccount.google.com/apppasswords to generate an App Password for Gmail.'
                    }
                });
            }
        }

        // Log email configuration (without sensitive data)
        console.log('Using email configuration:', {
            from: `${finalSenderName} <${finalSenderEmail}>`,
            to: email,
            subject: `Your Literexia ${userType} Account Credentials`
        });

        // Prepare email options
        const mailOptions = {
            from: `${finalSenderName} <${finalSenderEmail}>`, // Use final sender details (admin or system fallback)
            to: email,
            subject: `Your Literexia ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account Credentials`,
            html: getEmailTemplate(userType, email, password, originalAdminName, originalAdminEmail || finalSenderEmail)
        };

        // Send the email
        console.log('Attempting to send email...');
        const info = await finalTransporter.sendMail(mailOptions);
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