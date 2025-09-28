/**
 * API Key Security Validation Middleware
 * Ensures proper API key management and prevents exposure of sensitive credentials
 */

const crypto = require('crypto');

class APIKeyValidator {
    constructor() {
        this.requiredEnvVars = [
            'OPENAI_API_KEY',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'EMAIL_PASSWORD'
        ];
        this.sensitivePatterns = [
            /sk-[a-zA-Z0-9]{20,}/g,        // OpenAI API keys
            /AKIA[0-9A-Z]{16}/g,           // AWS Access Key ID
            /[A-Za-z0-9/+=]{40}/g,         // AWS Secret Access Key patterns
            /xoxb-[0-9]+-[0-9]+-[0-9]+-[a-z0-9]{32}/g, // Slack Bot tokens
            /ghp_[a-zA-Z0-9]{36}/g,        // GitHub Personal Access Tokens
            /AIza[0-9A-Za-z-_]{35}/g       // Google API keys
        ];
    }

    /**
     * Validate that required environment variables are set
     */
    validateEnvironmentVariables() {
        const missingVars = [];
        const invalidVars = [];

        for (const envVar of this.requiredEnvVars) {
            const value = process.env[envVar];

            if (!value) {
                missingVars.push(envVar);
            } else if (value.length < 8) {
                invalidVars.push(envVar);
            }
        }

        return {
            isValid: missingVars.length === 0 && invalidVars.length === 0,
            missingVars,
            invalidVars
        };
    }

    /**
     * Check for potential API key exposure in request/response data
     */
    detectKeyExposure(data) {
        const exposures = [];
        const dataString = JSON.stringify(data).toLowerCase();

        for (const pattern of this.sensitivePatterns) {
            const matches = dataString.match(pattern);
            if (matches) {
                exposures.push({
                    pattern: pattern.toString(),
                    matches: matches.map(match => match.substring(0, 8) + '***')
                });
            }
        }

        return exposures;
    }

    /**
     * Sanitize data by removing potential sensitive information
     */
    sanitizeData(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const sanitized = { ...data };
        const sensitiveFields = [
            'password', 'apikey', 'api_key', 'secret', 'token',
            'auth', 'credential', 'key', 'private'
        ];

        for (const field in sanitized) {
            const fieldLower = field.toLowerCase();

            // Check if field name contains sensitive keywords
            if (sensitiveFields.some(sensitive => fieldLower.includes(sensitive))) {
                sanitized[field] = '[REDACTED]';
            }

            // Recursively sanitize nested objects
            if (typeof sanitized[field] === 'object' && sanitized[field] !== null) {
                sanitized[field] = this.sanitizeData(sanitized[field]);
            }
        }

        return sanitized;
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        const envValidation = this.validateEnvironmentVariables();

        return {
            timestamp: new Date().toISOString(),
            environmentVariables: envValidation,
            recommendations: this.getSecurityRecommendations(envValidation),
            checkedPatterns: this.sensitivePatterns.length,
            requiredEnvVars: this.requiredEnvVars
        };
    }

    /**
     * Get security recommendations based on validation results
     */
    getSecurityRecommendations(envValidation) {
        const recommendations = [];

        if (envValidation.missingVars.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'Missing environment variables',
                variables: envValidation.missingVars,
                action: 'Set required environment variables in .env file'
            });
        }

        if (envValidation.invalidVars.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: 'Weak environment variables',
                variables: envValidation.invalidVars,
                action: 'Use stronger values for environment variables'
            });
        }

        recommendations.push({
            priority: 'LOW',
            issue: 'General security',
            action: 'Regularly rotate API keys and monitor for unauthorized usage'
        });

        return recommendations;
    }
}

const apiKeyValidator = new APIKeyValidator();

/**
 * Middleware to check for API key exposure in requests
 */
const checkAPIKeyExposure = (req, res, next) => {
    try {
        // Check request body for potential key exposure
        if (req.body) {
            const exposures = apiKeyValidator.detectKeyExposure(req.body);
            if (exposures.length > 0) {
                console.warn('[API KEY SECURITY] Potential API key exposure detected in request:', {
                    path: req.path,
                    method: req.method,
                    exposures: exposures,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return res.status(400).json({
                    error: 'Request contains potentially sensitive information',
                    message: 'Please remove any API keys or secrets from request data'
                });
            }
        }

        // Sanitize request body to prevent accidental logging
        if (req.body) {
            req.sanitizedBody = apiKeyValidator.sanitizeData(req.body);
        }

        next();
    } catch (error) {
        console.error('[API KEY SECURITY] Error in API key validation:', error);
        next(); // Continue on error to avoid breaking the application
    }
};

/**
 * Middleware to validate environment variables on startup
 */
const validateEnvironmentSetup = (req, res, next) => {
    const validation = apiKeyValidator.validateEnvironmentVariables();

    if (!validation.isValid) {
        console.error('[API KEY SECURITY] Environment validation failed:', validation);

        if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Required environment variables are not properly configured'
            });
        }
    }

    next();
};

/**
 * Security report endpoint
 */
const getSecurityReport = (req, res) => {
    try {
        const report = apiKeyValidator.generateSecurityReport();

        // Don't expose sensitive details in production
        if (process.env.NODE_ENV === 'production') {
            delete report.environmentVariables.missingVars;
            delete report.environmentVariables.invalidVars;
            delete report.requiredEnvVars;
        }

        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        console.error('[API KEY SECURITY] Error generating security report:', error);
        res.status(500).json({
            error: 'Failed to generate security report',
            message: error.message
        });
    }
};

module.exports = {
    checkAPIKeyExposure,
    validateEnvironmentSetup,
    getSecurityReport,
    apiKeyValidator
};