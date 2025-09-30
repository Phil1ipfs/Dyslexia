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
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e5e7eb; overflow: hidden;">

                <!-- Header Section -->
                <div style="background-color: #3B4F81; padding: 25px 30px; text-align: center; border-bottom: 2px solid #2a3a65;">
                    <div style="background-color: #ffffff; width: 50px; height: 50px; border-radius: 4px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #2a3a65;">
                        <span style="font-size: 24px; font-weight: bold; color: #3B4F81;">L</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Welcome to Literexia</h1>
                    <p style="color: #ffffff; margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Your Reading Journey Begins Here</p>
                </div>

                <!-- Main Content -->
                <div style="padding: 30px 40px;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h2 style="color: #3B4F81; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Account Created Successfully</h2>
                        <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.4;">Your ${userType} account has been created by <strong>${senderName}</strong></p>
                    </div>

                    <!-- Credentials Box -->
                    <div style="background-color: #3B4F81; border: 1px solid #2a3a65; border-radius: 4px; padding: 20px; margin: 20px 0; text-align: center;">
                        <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Your Login Credentials</h3>

                        <div style="background-color: #ffffff; border-radius: 4px; padding: 15px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #3B4F81; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Email Address</p>
                            <p style="margin: 8px 0 0 0; color: #3B4F81; font-size: 16px; font-weight: 600; word-break: break-all;">${email}</p>
                        </div>

                        <div style="background-color: #ffffff; border-radius: 4px; padding: 15px; border: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #3B4F81; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Temporary Password</p>
                            <p style="margin: 8px 0 0 0; color: #3B4F81; font-size: 16px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f8f9fa; padding: 10px 12px; border-radius: 4px; display: inline-block; border: 1px solid #d1d5db;">${password}</p>
                        </div>
                    </div>

                    <!-- Security Notice -->
                    <div style="background-color: #f8f9fa; border: 1px solid #d1d5db; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
                        <h4 style="color: #3B4F81; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Security Recommendation</h4>
                        <p style="color: #3B4F81; margin: 0; font-size: 13px; line-height: 1.4;">For your security, please change your password after your first login</p>
                    </div>

                    <!-- Contact Information -->
                    <div style="text-align: center; margin: 25px 0;">
                        <p style="color: #3B4F81; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Need help? We're here for you!</p>
                        <div style="background-color: #3B4F81; border-radius: 4px; padding: 15px; display: inline-block;">
                            <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">
                                Contact: <a href="mailto:${senderEmail}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${senderName}</a>
                            </p>
                            <p style="margin: 6px 0 0 0; color: #ffffff; font-size: 11px; opacity: 0.9;">${senderEmail}</p>
                        </div>
                    </div>

                    <!-- Call to Action -->
                    <div style="text-align: center; margin: 25px 0;">
                        <div style="background-color: #3B4F81; border: 1px solid #2a3a65; display: inline-block; padding: 12px 25px; border-radius: 4px;">
                            <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 600;">Ready to start your reading journey?</p>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #666; margin: 0 0 8px 0; font-size: 11px;">
                        Account created by: <strong>${senderName}</strong> (${senderEmail})
                    </p>
                    <div style="border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px;">
                        <p style="color: #3B4F81; margin: 0; font-size: 13px; font-weight: 600;">Best regards,</p>
                        <p style="color: #666; margin: 4px 0 0 0; font-size: 13px;">The Literexia Team</p>
                    </div>
                    <div style="margin-top: 15px;">
                        <p style="color: #999; margin: 0; font-size: 10px;">
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