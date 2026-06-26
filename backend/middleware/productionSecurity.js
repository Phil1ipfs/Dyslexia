const helmet = require('helmet');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');

// AWS EC2 Production Security Configuration
const createProductionSecurityConfig = () => {
  return {
    // Enhanced Helmet configuration for production
    helmet: helmet({
      contentSecurityPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    }),

    // Compression for AWS EC2 bandwidth optimization
    compression: compression({
      level: 6, // Good balance between speed and compression
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        // Don't compress if the client doesn't support it
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Compress JSON, HTML, CSS, JS
        return compression.filter(req, res);
      }
    }),

    // Trust proxy for AWS Load Balancer
    trustProxy: true,

    // Session configuration for production
    session: {
      name: 'sessionId', // Don't use default name
      secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      }
    }
  };
};

// AWS EC2 Cluster Configuration for High Availability
const setupCluster = () => {
  if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    const maxWorkers = Math.min(numCPUs, 4); // Limit workers for smaller EC2 instances

    console.log(`[CLUSTER] Master process ${process.pid} is running`);
    console.log(`[CLUSTER] Starting ${maxWorkers} workers for ${numCPUs} CPUs`);

    // Fork workers
    for (let i = 0; i < maxWorkers; i++) {
      cluster.fork();
    }

    // Handle worker crashes
    cluster.on('exit', (worker, code, signal) => {
      console.warn(`[CLUSTER] Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
      console.log('[CLUSTER] Starting a new worker');
      cluster.fork();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[CLUSTER] SIGTERM received, shutting down gracefully');
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
    });

    return false; // Don't start the app in master process
  } else {
    console.log(`[CLUSTER] Worker ${process.pid} started`);
    return true; // Start the app in worker process
  }
};

// Database Connection Optimization for AWS EC2
const optimizeMongoConnection = () => {
  return {
    maxPoolSize: 50, // More headroom so concurrent requests + background jobs don't
                     // exhaust the pool and make every DB query hang (was 10).
    minPoolSize: 5,  // Keep warm connections ready.
    waitQueueTimeoutMS: 10000, // If no pool connection is free in 10s, fail fast
                               // (fast error) instead of hanging the request.
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6

    // AWS-specific optimizations
    retryWrites: true,
    retryReads: true,
    readPreference: 'secondaryPreferred', // Read from secondary when possible
    writeConcern: { w: 'majority', j: true, wtimeout: 10000 },

    // Connection pool events for monitoring
    monitorCommands: process.env.NODE_ENV === 'development'
  };
};

// AWS CloudWatch Logging Integration
const setupCloudWatchLogging = () => {
  if (process.env.NODE_ENV === 'production') {
    // Structure logs for CloudWatch
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        pid: process.pid,
        message: args.join(' ')
      };
      originalConsoleLog(JSON.stringify(logEntry));
    };

    console.error = (...args) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        pid: process.pid,
        message: args.join(' '),
        stack: new Error().stack
      };
      originalConsoleError(JSON.stringify(logEntry));
    };

    console.warn = (...args) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        pid: process.pid,
        message: args.join(' ')
      };
      originalConsoleWarn(JSON.stringify(logEntry));
    };
  }
};

// Health Check Endpoint for AWS Load Balancer
const createHealthCheckEndpoint = (app) => {
  app.get('/health', (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'OK',
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    try {
      res.status(200).json(healthCheck);
    } catch (error) {
      healthCheck.status = 'ERROR';
      res.status(503).json(healthCheck);
    }
  });

  // Readiness check for Kubernetes/ECS
  app.get('/ready', (req, res) => {
    // Add database connectivity check
    res.status(200).json({
      status: 'READY',
      timestamp: Date.now(),
      pid: process.pid
    });
  });
};

// Memory and Performance Monitoring
const setupPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };

      // Alert if memory usage is too high (for t3.micro: warn at 800MB, critical at 900MB)
      if (memUsageMB.rss > 800) {
        console.warn(`[PERFORMANCE] High memory usage: ${JSON.stringify(memUsageMB)}`);
      }

      if (memUsageMB.rss > 900) {
        console.error(`[PERFORMANCE] Critical memory usage: ${JSON.stringify(memUsageMB)}`);
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    }, 60000); // Check every minute

    // Monitor event loop lag
    let start = process.hrtime.bigint();
    setInterval(() => {
      const delta = process.hrtime.bigint() - start;
      const nanosec = Number(delta);
      const millisec = nanosec / 1e6;
      const lag = millisec - 1000; // Expected 1000ms interval

      if (lag > 100) { // Alert if event loop lag > 100ms
        console.warn(`[PERFORMANCE] Event loop lag: ${lag.toFixed(2)}ms`);
      }

      start = process.hrtime.bigint();
    }, 1000);
  }
};

// AWS EC2 Auto-scaling Health Metrics
const setupAutoScalingMetrics = (app) => {
  let requestCount = 0;
  let errorCount = 0;
  let responseTimeSum = 0;
  let responseCount = 0;

  // Middleware to track metrics
  const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    requestCount++;

    res.on('finish', () => {
      const responseTime = Date.now() - start;
      responseTimeSum += responseTime;
      responseCount++;

      if (res.statusCode >= 400) {
        errorCount++;
      }
    });

    next();
  };

  // Metrics endpoint for monitoring
  app.get('/metrics', (req, res) => {
    const averageResponseTime = responseCount > 0 ? responseTimeSum / responseCount : 0;
    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

    res.json({
      requestCount,
      errorCount,
      errorRate: parseFloat(errorRate.toFixed(2)),
      averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: Date.now()
    });
  });

  return metricsMiddleware;
};

// Process optimization for AWS EC2
const optimizeProcess = () => {
  // Increase max listeners to prevent memory leaks warning
  process.setMaxListeners(15);

  // Handle uncaught exceptions gracefully
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    // Log to CloudWatch and gracefully shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
    // Log to CloudWatch
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[SHUTDOWN] SIGINT received, shutting down gracefully');
    process.exit(0);
  });
};

module.exports = {
  createProductionSecurityConfig,
  setupCluster,
  optimizeMongoConnection,
  setupCloudWatchLogging,
  createHealthCheckEndpoint,
  setupPerformanceMonitoring,
  setupAutoScalingMetrics,
  optimizeProcess
};