# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)







ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ nano utils/securityTestSuite.js
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ sudo pkill -9 node
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ sleep 3
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ nohup node server.js > server.log 2>&1 &
[1] 104189
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$  sleep 5
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ tail -30 server.log
nohup: ignoring input
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ ps aux | grep node
ubuntu    104189 45.0 11.9 11799296 117436 pts/0 Rl   22:17   0:18 node server.js
ubuntu    104202 32.2  7.2 1076316 70976 ?       Rsl  22:17   0:04 node /home/ubuntu/Dyslexia/backend/server.js
ubuntu    104209 31.2  6.8 1073800 67564 ?       Rsl  22:17   0:03 node /home/ubuntu/Dyslexia/backend/server.js
ubuntu    104225  0.0  0.2   7076  2072 pts/0    S+   22:17   0:00 grep --color=auto node
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ sudo lsof -i :5001
COMMAND    PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    104189 ubuntu   23u  IPv6 377062      0t0  TCP *:5001 (LISTEN)
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ sleep 5
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$ cat server.log
nohup: ignoring input
AWS credentials detected in environment variables
AWS Region: ap-southeast-2
AWS Bucket: literexia-bucket
Attempting to connect to MongoDB...

✅ HTTP Server is running on port 5000 (backup)
Frontend URL: https://literexia.com
API URL (HTTP - backup): http://18.139.217.179:5000
🔧 Starting automatic data consistency fix...
[AUTO-FIX] 🔧 Starting comprehensive category repair system...
[AUTO-FIX] 📊 Step 1: Fixing question counts from main_assessment...

✅ HTTPS Server is running on port 5001 with self-signed certificate
API URL (HTTPS - MAIN): https://18.139.217.179:5001
🔒 Mixed content issue resolved - frontend can now connect via HTTPS
(node:104189) [MONGOOSE] Warning: Duplicate schema index on {"categoryResultId":1} found. This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
(Use `node --trace-warnings ...` to show where the warning was created)
✅ MongoDB Connected to test database
MongoDB Connected: ac-qlfl5i6-shard-00-02.0f8ylb8.mongodb.net
[AUTO-FIX] 📋 Phonological Awareness: 6 questions
[AUTO-FIX] 📋 Word Recognition: 15 questions
[AUTO-FIX] 📋 Alphabet Knowledge: 15 questions
[AUTO-FIX] 📋 Alphabet Knowledge: 15 questions
[AUTO-FIX] 📋 Alphabet Knowledge: 15 questions
[AUTO-FIX] 📋 Alphabet Knowledge: 15 questions
[AUTO-FIX] 📋 Alphabet Knowledge: 15 questions
[AUTO-FIX] 📋 Phonological Awareness: 6 questions
[AUTO-FIX] 📋 Phonological Awareness: 6 questions
[AUTO-FIX] 📋 Phonological Awareness: 6 questions
[AUTO-FIX] 📋 Decoding: 15 questions
[AUTO-FIX] 📋 Decoding: 15 questions
[AUTO-FIX] 📋 Decoding: 15 questions
[AUTO-FIX] 📋 Word Recognition: 15 questions
[AUTO-FIX] 📋 Reading Comprehension: 10 questions
[AUTO-FIX] 🔧 Processing Phonological Awareness...

Verifying database structure:
test database collections: [
  'intervention_responses',
  'users',
  'templates_questions',
  'intervention_results',
  'prescriptive_analysis_errors',
  'prescriptive_analysis',
  'parentprofiles',
  'audit_logs',
  'main_assessment',
  'student_responses',
  'iep_reports',
  'category_results',
  'intervention_assessment',
  'sentence_templates'
]
teachers database collections: [ 'profile' ]
parent database collections: [ 'parent_profile', 'child_pdf' ]
Available collections in test:
- intervention_responses
- users
- templates_questions
- intervention_results
- prescriptive_analysis_errors
- prescriptive_analysis
- parentprofiles
- audit_logs
- main_assessment
- student_responses
- iep_reports
- category_results
- intervention_assessment
- sentence_templates

Initial collection counts:
- Students (test/users): 2
- Teachers (teachers/profile): 1
- Parents (parent/parent_profile): 2
Total users: 5
Available databases:
- Pre_Assessment
- admin_user
- parent
- teachers
- test
- users_web
- admin
- local
Created connection to parent database
Created connection to users_web database
🔄 Initializing ManageProgress module...
Found 2 students to initialize progress tracking for.
✅ ManageProgress module initialized successfully
✅ Initialized progress collections
✅ Category results service initialized for read-only access

✅ Database setup complete
Database connected successfully - registering routes
User model is targeting collection: users
✅ Auth routes registered at /api/auth/*
✅ Security monitoring routes registered at /api/security/*
teacherRoutes.js loaded
✅ Teacher and student routes registered at /api/admin/manage/*
✅ Parent admin routes registered at /api/admin/manage/*
✅ Email routes registered at /api/admin/send-credentials
>> Loading parentProfileController.js <<
✅ Parent routes registered at /api/parents/*
✅ Child PDF routes registered at /api/parent/child_pdf
✅ Admin routes registered at /api/admin/*
✅ Loaded roles routes
✅ Loaded teacher profile routes
✅ Loaded manage progress routes
✅ Loaded category progress routes at /api/category-progress/*
✅ Loaded student response routes at /api/student-responses/*
✅ Loaded intervention routes
✅ Loaded upload file routes
✅ Loaded prescriptive analytics routes at /api/prescriptive-analytics/*
✅ Loaded intervention assessment routes at /api/intervention-assessment/*
✅ Loaded intervention monitoring routes at /api/intervention-monitoring/*
✅ Loaded templates routes at /api/templates/*
✅ Loaded auto-processing routes at /api/auto-processing/*
✅ Loaded student routes
✅ Loaded chatbot routes
✅ Loaded category results fix routes at /api/category-results-fix/*
✅ Loaded intervention responses routes at /api/intervention-responses/*
✅ Loaded intervention results routes at /api/intervention-results/*
✅ Loaded dashboard routes at /api/teachers/dashboard/*
✅ Loaded main assessment routes at /api/main-assessment/*
✅ Loaded pre-assessment routes at /api/pre-assessment/*
✅ Loaded assessment routes at /api/assessment/*
✅ Loaded Teacher category result routes at /api/teachers/category-results/*
✅ Loaded Frontend compatibility category result routes at /api/category-results/*
✅ Loaded IEP routes at /api/iep/*
⚠️ MobileFallbackService not available, using static fallbacks
✅ Loaded upload routes at /api/uploads/*
✅ Loaded database cleanup routes at /api/cleanup/*
✅ Loaded data migration routes at /api/data-migration/*
[AUTO-FIX] 📊 Found 0 category results with incorrect Phonological Awareness data
[AUTO-FIX] 🔧 Processing Word Recognition...
[AUTO-FIX] 📊 Found 0 category results with incorrect Word Recognition data
[AUTO-FIX] 🔧 Processing Alphabet Knowledge...
[AUTO-FIX] 📊 Found 0 category results with incorrect Alphabet Knowledge data
[AUTO-FIX] 🔧 Processing Decoding...
[AUTO-FIX] 📊 Found 0 category results with incorrect Decoding data
[AUTO-FIX] 🔧 Processing Reading Comprehension...
[AUTO-FIX] 📊 Found 0 category results with incorrect Reading Comprehension data
[AUTO-FIX] 🎉 Fixed 0 category results across all categories!
[COMPREHENSIVE FIX] 🔧 Starting DYNAMIC totalQuestions correction for all category results...
✅ S3 connection successful - available buckets: literexia-bucket
S3 bucket configuration is working correctly
[COMPREHENSIVE FIX] 📚 Found 15 main assessment records in database
[COMPREHENSIVE FIX] 📋 DYNAMIC question counts from main_assessment:
[COMPREHENSIVE FIX]   📝 Phonological Awareness: 6 questions (Reading Level: High Emerging)
[COMPREHENSIVE FIX]   📝 Word Recognition: 15 questions (Reading Level: Transitioning)
[COMPREHENSIVE FIX]   📝 Alphabet Knowledge: 15 questions (Reading Level: Low Emerging)
[COMPREHENSIVE FIX]   📝 Alphabet Knowledge: 15 questions (Reading Level: High Emerging)
[COMPREHENSIVE FIX]   📝 Alphabet Knowledge: 15 questions (Reading Level: Developing)
[COMPREHENSIVE FIX]   📝 Alphabet Knowledge: 15 questions (Reading Level: Transitioning)
[COMPREHENSIVE FIX]   📝 Alphabet Knowledge: 15 questions (Reading Level: At Grade Level)
[COMPREHENSIVE FIX]   📝 Phonological Awareness: 6 questions (Reading Level: Developing)
[COMPREHENSIVE FIX]   📝 Phonological Awareness: 6 questions (Reading Level: Transitioning)
[COMPREHENSIVE FIX]   📝 Phonological Awareness: 6 questions (Reading Level: At Grade Level)
[COMPREHENSIVE FIX]   📝 Decoding: 15 questions (Reading Level: Developing)
[COMPREHENSIVE FIX]   📝 Decoding: 15 questions (Reading Level: Transitioning)
[COMPREHENSIVE FIX]   📝 Decoding: 15 questions (Reading Level: At Grade Level)
[COMPREHENSIVE FIX]   📝 Word Recognition: 15 questions (Reading Level: At Grade Level)
[COMPREHENSIVE FIX]   📝 Reading Comprehension: 10 questions (Reading Level: At Grade Level)
[COMPREHENSIVE FIX] 📊 Found 2 total category result records to check
[COMPREHENSIVE FIX] 🔍 Checking student 202533333 (1/2)
[COMPREHENSIVE FIX] ✅ Student 202533333 record already correct
[COMPREHENSIVE FIX] 🔍 Checking student 202522233 (2/2)
[COMPREHENSIVE FIX] ✅ Student 202522233 record already correct
[COMPREHENSIVE FIX] 🎉 Complete! Checked 2 records, Fixed 0 category result records
[COMPREHENSIVE FIX] 📊 All totalQuestions now dynamically match main_assessment data
[COMPREHENSIVE REPAIR] 🔧 Step 2: Repairing ALL incomplete category records...
Email server is ready to send messages
[COMPREHENSIVE REPAIR] 📊 Found 2 students with reading levels
[COMPREHENSIVE REPAIR] 🔍 Checking Philip Pangilinan (202533333) - At Grade Level
[COMPREHENSIVE REPAIR]   📚 Required categories for At Grade Level: Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension
[COMPREHENSIVE REPAIR]   🚫 PROGRESSION COMPLETED - Cannot modify record (allCategoriesPassed=true)
[COMPREHENSIVE REPAIR]   ✅ Record has completed its level progression
[COMPREHENSIVE REPAIR] 🔍 Checking Kit Santiago (202522233) - Low Emerging
[COMPREHENSIVE REPAIR]   📚 Required categories for Low Emerging: Alphabet Knowledge
[COMPREHENSIVE REPAIR]   ✅ COMPLETE CURRENT RECORD - All 1 categories present
[COMPREHENSIVE REPAIR] ✅ Repair complete: 0 fixed, 2 already complete
[OVERALL SCORE FIX] 🔧 Fixing existing records with incorrect overall scores...
[COMPLETION DETECTION] ✅ Alphabet Knowledge: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Phonological Awareness: PASSED INTERVENTION (score: 0%)
[COMPLETION DETECTION] ✅ Decoding: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Word Recognition: PASSED INTERVENTION (score: 53%)
[COMPLETION DETECTION] ✅ Reading Comprehension: PASSED INTERVENTION (score: 0%)
[OVERALL STATS] DEBUG Alphabet Knowledge: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Alphabet Knowledge: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Alphabet Knowledge: 100% (intervention)
[OVERALL STATS] DEBUG Phonological Awareness: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 25, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Phonological Awareness: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Phonological Awareness: 100% (intervention)
[OVERALL STATS] DEBUG Decoding: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Decoding: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Decoding: 100% (intervention)
[OVERALL STATS] DEBUG Word Recognition: {
  originalScore: 53,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 0, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Word Recognition: 100% (original: 53%)
[OVERALL STATS] 📊 Final score for Word Recognition: 100% (intervention)
[OVERALL STATS] DEBUG Reading Comprehension: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Reading Comprehension: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Reading Comprehension: 100% (intervention)
[OVERALL STATS] ✅ ENHANCED CALCULATION: 100% average of [100, 100, 100, 100, 100]
[OVERALL STATS] Passed: 5, Failed: 0, Total: 5
[COMPLETION DETECTION] ❌ Alphabet Knowledge: INCOMPLETE (score: 7%, interventions: 0)
[OVERALL STATS] DEBUG Alphabet Knowledge: {
  originalScore: 7,
  mainAssessmentPassed: false,
  interventionHistory: [],
  hasSuccessfulIntervention: false
}
[OVERALL STATS] ⚪ Using original score for Alphabet Knowledge: 7%
[OVERALL STATS] 📊 Final score for Alphabet Knowledge: 7% (original)
[OVERALL STATS] ✅ ENHANCED CALCULATION: 7% average of [7]
[OVERALL STATS] Passed: 0, Failed: 1, Total: 1
[OVERALL SCORE FIX] ✅ Complete: 0 fixed, 2 already correct
[FORCE FIX] 🔧 Running force fix for specific problematic students...
[FORCE FIX] 🔧 Force fixing overall score for student 202533333...
[FORCE FIX] 📊 Current overall score: 100%
[COMPLETION DETECTION] ✅ Alphabet Knowledge: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Phonological Awareness: PASSED INTERVENTION (score: 0%)
[COMPLETION DETECTION] ✅ Decoding: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Word Recognition: PASSED INTERVENTION (score: 53%)
[COMPLETION DETECTION] ✅ Reading Comprehension: PASSED INTERVENTION (score: 0%)
[OVERALL STATS] DEBUG Alphabet Knowledge: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Alphabet Knowledge: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Alphabet Knowledge: 100% (intervention)
[OVERALL STATS] DEBUG Phonological Awareness: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 25, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Phonological Awareness: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Phonological Awareness: 100% (intervention)
[OVERALL STATS] DEBUG Decoding: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Decoding: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Decoding: 100% (intervention)
[OVERALL STATS] DEBUG Word Recognition: {
  originalScore: 53,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 0, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Word Recognition: 100% (original: 53%)
[OVERALL STATS] 📊 Final score for Word Recognition: 100% (intervention)
[OVERALL STATS] DEBUG Reading Comprehension: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Reading Comprehension: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Reading Comprehension: 100% (intervention)
[OVERALL STATS] ✅ ENHANCED CALCULATION: 100% average of [100, 100, 100, 100, 100]
[OVERALL STATS] Passed: 5, Failed: 0, Total: 5
[FORCE FIX] 📊 Calculated correct score: 100%
[FORCE FIX] 🔒 Preserving original isPassed for Alphabet Knowledge: false
[FORCE FIX] 🔒 Preserving original isPassed for Phonological Awareness: false
[FORCE FIX] 🔒 Preserving original isPassed for Decoding: false
[FORCE FIX] 🔒 Preserving original isPassed for Word Recognition: false
[FORCE FIX] 🔒 Preserving original isPassed for Reading Comprehension: false
[FORCE FIX] 📊 MongoDB updateOne result: {
  acknowledged: true,
  modifiedCount: 1,
  upsertedId: null,
  upsertedCount: 0,
  matchedCount: 1
}
[FORCE FIX] ✅ Verification: Overall score is now 100%
[FORCE FIX] ✅ SUCCESS: Student 202533333 overall score fixed: 100%
[FORCE FIX] ✅ Student 202533333: 100% → 100%
[AUTO-FIX] ✅ Comprehensive category repair completed successfully
✅ Automatic data consistency fix completed
⚠️ AUTOMATIC PROGRESSION DISABLED - Teacher-triggered only via IEP dashboard
[AUTO PROCESSOR] 🚀 Starting periodic auto-processing every 5 minutes
[AUTO PROCESSOR] 🔍 Scanning for students with complete assessments...
[AUTO PROCESSOR] ⚠️ AUTOMATIC PROGRESSION DISABLED - Teacher-triggered only via IEP dashboard
🤖 Auto-processing service started - will check for complete assessments every 5 minutes
🔄 Starting intervention data sync...

🔄 INTERVENTION DATA SYNC
=========================
Syncing existing intervention data with category_results...
[AUTO PROCESSOR] Found 2 students with reading levels assigned
[AUTO PROCESSOR] 📋 Checking student: Philip Pangilinan (202533333) - At Grade Level
[AUTO PROCESSOR]    📚 Categories for At Grade Level: [Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension]
[AUTO PROCESSOR]    🔍 Processing category 1/5: Alphabet Knowledge
[AUTO PROCESSOR] ⚠️  Alphabet Knowledge: NO ANALYSIS FOUND - Category complete but no prescriptive analysis exists, generating...
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
📋 Found 23 completed interventions to sync
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: No category_results found for student
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 76/15 questions answered
[AUTO PROCESSOR]        ✅ Alphabet Knowledge is complete - generating category result...
[CATEGORY RESULTS] Generating category results from responses for student 202533333
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: No category_results found for student
[CATEGORY RESULTS] Found student 202533333 with reading level: At Grade Level
[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)
[CATEGORY RESULTS] Required categories for At Grade Level: [Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension]
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: No category_results found for student
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: No category_results found for student
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 76/15 questions answered
[CATEGORY RESULTS] Alphabet Knowledge: COMPLETE (76/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Phonological Awareness: 6 questions required
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: No category_results found for student
[COMPLETENESS VALIDATION] Phonological Awareness COMPLETE: 25/6 questions answered
[CATEGORY RESULTS] Phonological Awareness: COMPLETE (25/6)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Decoding: 15 questions required
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: No category_results found for student
[COMPLETENESS VALIDATION] Decoding COMPLETE: 45/15 questions answered
[CATEGORY RESULTS] Decoding: COMPLETE (45/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
   ⏭️  Skipped student 202533333 - Decoding: No category_results found for student
[COMPLETENESS VALIDATION] Checking Word Recognition: 15 questions required
   ⏭️  Skipped student 202533333 - Decoding: No category_results found for student
[COMPLETENESS VALIDATION] Word Recognition COMPLETE: 30/15 questions answered
[CATEGORY RESULTS] Word Recognition: COMPLETE (30/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
   ⏭️  Skipped student 202533333 - Decoding: No category_results found for student
[COMPLETENESS VALIDATION] Checking Reading Comprehension: 10 questions required
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: No category_results found for student
[COMPLETENESS VALIDATION] Reading Comprehension COMPLETE: 10/10 questions answered
[CATEGORY RESULTS] Reading Comprehension: COMPLETE (10/10)
[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION
   ⏭️  Skipped student 202533333 - Phonological Awareness: No category_results found for student
[CATEGORY RESULTS] Found 15 responses for student 202533333 at reading level At Grade Level
[CATEGORY RESULTS] 🔍 DEBUG: Found responses for categories: [Alphabet Knowledge]
[CATEGORY RESULTS] 🔍 DEBUG: Phonological Awareness responses: 0
[CATEGORY RESULTS] 🔍 DEBUG: Query used: {"studentId":202533333,"readingLevel":"At Grade Level","category":"Alphabet Knowledge"}
[CATEGORY RESULTS] Processing 15 responses for Alphabet Knowledge
   ⏭️  Skipped student 202533333 - Phonological Awareness: No category_results found for student
   ⏭️  Skipped student 202533333 - Decoding: No category_results found for student
[AUTO-FIX] ⚠️ No main assessment found for Alphabet Knowledge, using response count
[AUTO-FIX] Alphabet Knowledge: Using 15 total questions (0 from main assessment, 15 responses)
[CATEGORY RESULTS] ⏭️  Skipping Phonological Awareness (processing specific category: Alphabet Knowledge)
[CATEGORY RESULTS] ⏭️  Skipping Decoding (processing specific category: Alphabet Knowledge)
[CATEGORY RESULTS] ⏭️  Skipping Word Recognition (processing specific category: Alphabet Knowledge)
[CATEGORY RESULTS] ⏭️  Skipping Reading Comprehension (processing specific category: Alphabet Knowledge)
[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS
Fetching category results for student ID: 202533333
   ⏭️  Skipped student 202533333 - Decoding: No category_results found for student
Found 1 category results for student: 202533333
[NORMALIZE] ✅ Alphabet Knowledge: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Phonological Awareness: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Decoding: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Word Recognition: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Reading Comprehension: PASSED INTERVENTION - interventionRequired: false
[CATEGORY RESULTS] ⚠️  EXISTING RECORDS FOUND - CHECKING IF MODIFICATION IS ALLOWED
[CATEGORY RESULTS] 📊 Found 1 existing records for student 202533333
[CATEGORY RESULTS] ✅ CURRENT LEVEL RECORD FOUND - Checking modification permissions
[CATEGORY RESULTS] 🚫 PROGRESSION COMPLETED - Cannot modify record with allCategoriesPassed=true
[CATEGORY RESULTS] ✅ This record has completed its level progression - skipping modification
[AUTO PROCESSOR]    ✅ Alphabet Knowledge: PROCESSED
[AUTO PROCESSOR]    🔍 Processing category 2/5: Phonological Awareness
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: Already synced
[AUTO PROCESSOR] 🔍 DEBUG PA: categoryData found: true
[AUTO PROCESSOR] 🔍 DEBUG PA: isCompleted: true, score: 0, isPassed: false
   ⏭️  Skipped student 202533333 - Alphabet Knowledge: Already synced
[AUTO PROCESSOR] ⚠️  Phonological Awareness: NO ANALYSIS FOUND - Category complete but no prescriptive analysis exists, generating...
[AUTO PROCESSOR] 🔍 Checking prerequisites for Phonological Awareness: [Alphabet Knowledge]
   ⏭️  Skipped student 202533333 - Phonological Awareness: Already synced
[AUTO PROCESSOR] 🔍 Alphabet Knowledge prerequisite check: {
  originalPassed: false,
  originalScore: 40,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: 1 passed interventions
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Alphabet Knowledge final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied - allowing Phonological Awareness
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
   ⏭️  Skipped student 202533333 - Phonological Awareness: Already synced
   ⏭️  Skipped student 202533333 - Decoding: Already synced
[COMPLETENESS VALIDATION] Checking Phonological Awareness: 6 questions required
   ⏭️  Skipped student 202533333 - Decoding: Already synced
[COMPLETENESS VALIDATION] Phonological Awareness COMPLETE: 25/6 questions answered
[AUTO PROCESSOR]        ✅ Phonological Awareness is complete - generating category result...
[CATEGORY RESULTS] Generating category results from responses for student 202533333
   ⏭️  Skipped student 202533333 - Word Recognition: Already synced
[CATEGORY RESULTS] Found student 202533333 with reading level: At Grade Level
[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)
[CATEGORY RESULTS] Required categories for At Grade Level: [Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension]
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
   ⏭️  Skipped student 202533333 - Word Recognition: Already synced
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
   🔄 Syncing intervention data for 202533333 - Reading Comprehension
   🎉 Intervention passed! Marking category as completed via intervention
   🔒 PRESERVING original assessment data:
   🔒 - Original score: 0% (PRESERVED)
   🔒 - Original isPassed: false (PRESERVED)
   📊 - Intervention score: 100% (tracked in history only)
   ✅ Category completion status updated without overwriting original assessment data
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 76/15 questions answered
[CATEGORY RESULTS] Alphabet Knowledge: COMPLETE (76/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
   ✅ Updated category_results for student 202533333 - Reading Comprehension

📊 SYNC SUMMARY:
   - Total processed: 23
   - Updated: 1
   - Skipped: 22
   - Errors: 0
✅ Intervention sync completed: 1 updated, 22 skipped
🔧 Starting category results fix service...
[CATEGORY FIX] 🔧 Starting automatic category results fix...
[COMPLETENESS VALIDATION] Checking Phonological Awareness: 6 questions required
[CATEGORY FIX] 📋 Found 1 category results with passed categories or interventions
[COMPLETION DETECTION] ✅ Alphabet Knowledge: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Phonological Awareness: PASSED INTERVENTION (score: 0%)
[COMPLETION DETECTION] ✅ Decoding: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Word Recognition: PASSED INTERVENTION (score: 53%)
[COMPLETION DETECTION] ✅ Reading Comprehension: PASSED INTERVENTION (score: 0%)
[OVERALL STATS] DEBUG Alphabet Knowledge: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Alphabet Knowledge: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Alphabet Knowledge: 100% (intervention)
[OVERALL STATS] DEBUG Phonological Awareness: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 25, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Phonological Awareness: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Phonological Awareness: 100% (intervention)
[OVERALL STATS] DEBUG Decoding: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Decoding: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Decoding: 100% (intervention)
[OVERALL STATS] DEBUG Word Recognition: {
  originalScore: 53,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 0, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Word Recognition: 100% (original: 53%)
[OVERALL STATS] 📊 Final score for Word Recognition: 100% (intervention)
[OVERALL STATS] DEBUG Reading Comprehension: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Reading Comprehension: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Reading Comprehension: 100% (intervention)
[OVERALL STATS] ✅ ENHANCED CALCULATION: 100% average of [100, 100, 100, 100, 100]
[OVERALL STATS] Passed: 5, Failed: 0, Total: 5
[CATEGORY FIX] 📊 Using CategoryResultsService.calculateOverallStats for accurate score calculation
[CATEGORY FIX] 📊 Correct overall score calculation: 100%
[CATEGORY FIX] ⏭️  Student 202533333: Already correct
[CATEGORY FIX] ✅ Fix complete: 0 fixed, 1 skipped
✅ Category results fix completed: 0 fixed, 1 already correct
[CATEGORY FIX] 🔄 Starting auto-fix monitoring (every 10 minutes)
🔄 Category results auto-fix monitoring started (every 10 minutes)
[INTERVENTION MONITORING] 🚀 Starting intervention monitoring service (check interval: 30s)
[INTERVENTION MONITORING] 🔍 Checking for completed interventions at 2025-09-29T22:18:08.002Z
[INTERVENTION MONITORING] ✅ Service started successfully
🎯 Intervention monitoring service auto-started - will check for completed interventions every 30 seconds
[CATEGORY FIX] 🔧 Running startup category results fix...
[CATEGORY FIX] 🔧 Starting automatic category results fix...
[CATEGORY FIX] 🔄 Starting auto-fix monitoring (every 5 minutes)
🎯 Category results fix service auto-started - will check and fix category statistics every 5 minutes
⚠️ Could not start automatic data processor: Cannot find module '../models/Teachers/studentResponseModel'
Require stack:
- /home/ubuntu/Dyslexia/backend/services/AutomaticDataProcessor.js
- /home/ubuntu/Dyslexia/backend/server.js
📋 Starting automatic IEP report generation...
[IEP AUTO GEN] 🚀 Initializing automatic IEP report generation...
✅ Automatic IEP report generator initialized - will generate IEP reports from assessments and interventions
[COMPLETENESS VALIDATION] Phonological Awareness COMPLETE: 25/6 questions answered
[CATEGORY RESULTS] Phonological Awareness: COMPLETE (25/6)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[INTERVENTION MONITORING] Found 1 active interventions to check
[CATEGORY FIX] 📋 Found 1 category results with passed categories or interventions
[COMPLETION DETECTION] ✅ Alphabet Knowledge: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Phonological Awareness: PASSED INTERVENTION (score: 0%)
[COMPLETION DETECTION] ✅ Decoding: PASSED INTERVENTION (score: 40%)
[COMPLETION DETECTION] ✅ Word Recognition: PASSED INTERVENTION (score: 53%)
[COMPLETION DETECTION] ✅ Reading Comprehension: PASSED INTERVENTION (score: 0%)
[OVERALL STATS] DEBUG Alphabet Knowledge: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Alphabet Knowledge: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Alphabet Knowledge: 100% (intervention)
[OVERALL STATS] DEBUG Phonological Awareness: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 25, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Phonological Awareness: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Phonological Awareness: 100% (intervention)
[OVERALL STATS] DEBUG Decoding: {
  originalScore: 40,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 33, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Decoding: 100% (original: 40%)
[OVERALL STATS] 📊 Final score for Decoding: 100% (intervention)
[OVERALL STATS] DEBUG Word Recognition: {
  originalScore: 53,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 0, isPassed: false }, { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Word Recognition: 100% (original: 53%)
[OVERALL STATS] 📊 Final score for Word Recognition: 100% (intervention)
[OVERALL STATS] DEBUG Reading Comprehension: {
  originalScore: 0,
  mainAssessmentPassed: false,
  interventionHistory: [ { score: 100, isPassed: true } ],
  hasSuccessfulIntervention: true
}
[OVERALL STATS] ✅ Using intervention score for Reading Comprehension: 100% (original: 0%)
[OVERALL STATS] 📊 Final score for Reading Comprehension: 100% (intervention)
[OVERALL STATS] ✅ ENHANCED CALCULATION: 100% average of [100, 100, 100, 100, 100]
[OVERALL STATS] Passed: 5, Failed: 0, Total: 5
[CATEGORY FIX] 📊 Using CategoryResultsService.calculateOverallStats for accurate score calculation
[CATEGORY FIX] 📊 Correct overall score calculation: 100%
[CATEGORY FIX] ⏭️  Student 202533333: Already correct
[CATEGORY FIX] ✅ Fix complete: 0 fixed, 1 skipped
[CATEGORY FIX] ✅ Startup fix completed: 0 fixed, 1 already correct
[INTERVENTION MONITORING] 📊 Check complete: 0 completed, 0 auto-processed (480ms)
[COMPLETENESS VALIDATION] Checking Decoding: 15 questions required
[COMPLETENESS VALIDATION] Decoding COMPLETE: 45/15 questions answered
[CATEGORY RESULTS] Decoding: COMPLETE (45/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Word Recognition: 15 questions required
[COMPLETENESS VALIDATION] Word Recognition COMPLETE: 30/15 questions answered
[CATEGORY RESULTS] Word Recognition: COMPLETE (30/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Reading Comprehension: 10 questions required
[COMPLETENESS VALIDATION] Reading Comprehension COMPLETE: 10/10 questions answered
[CATEGORY RESULTS] Reading Comprehension: COMPLETE (10/10)
[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION
[CATEGORY RESULTS] Found 6 responses for student 202533333 at reading level At Grade Level
[CATEGORY RESULTS] 🔍 DEBUG: Found responses for categories: [Phonological Awareness]
[CATEGORY RESULTS] 🔍 DEBUG: Phonological Awareness responses: 6
[CATEGORY RESULTS] 🔍 DEBUG: PA questionIds: [PA_001, PA_002, PA_003, PA_004, PA_005, PA_006]
[CATEGORY RESULTS] 🔍 DEBUG: Query used: {"studentId":202533333,"readingLevel":"At Grade Level","category":"Phonological Awareness"}
[CATEGORY RESULTS] ⏭️  Skipping Alphabet Knowledge (processing specific category: Phonological Awareness)
[CATEGORY RESULTS] Processing 6 responses for Phonological Awareness
[AUTO-FIX] ⚠️ No main assessment found for Phonological Awareness, using response count
[AUTO-FIX] Phonological Awareness: Using 6 total questions (0 from main assessment, 6 responses)
[CATEGORY RESULTS] ⏭️  Skipping Decoding (processing specific category: Phonological Awareness)
[CATEGORY RESULTS] ⏭️  Skipping Word Recognition (processing specific category: Phonological Awareness)
[CATEGORY RESULTS] ⏭️  Skipping Reading Comprehension (processing specific category: Phonological Awareness)
[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS
Fetching category results for student ID: 202533333
Found 1 category results for student: 202533333
[NORMALIZE] ✅ Alphabet Knowledge: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Phonological Awareness: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Decoding: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Word Recognition: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Reading Comprehension: PASSED INTERVENTION - interventionRequired: false
[CATEGORY RESULTS] ⚠️  EXISTING RECORDS FOUND - CHECKING IF MODIFICATION IS ALLOWED
[CATEGORY RESULTS] 📊 Found 1 existing records for student 202533333
[CATEGORY RESULTS] ✅ CURRENT LEVEL RECORD FOUND - Checking modification permissions
[CATEGORY RESULTS] 🚫 PROGRESSION COMPLETED - Cannot modify record with allCategoriesPassed=true
[CATEGORY RESULTS] ✅ This record has completed its level progression - skipping modification
[AUTO PROCESSOR]    ✅ Phonological Awareness: PROCESSED
[AUTO PROCESSOR]    🔍 Processing category 3/5: Decoding
[AUTO PROCESSOR] ⚠️  Decoding: NO ANALYSIS FOUND - Category complete but no prescriptive analysis exists, generating...
[AUTO PROCESSOR] 🔍 Checking prerequisites for Decoding: [Alphabet Knowledge, Phonological Awareness]
[AUTO PROCESSOR] 🔍 Alphabet Knowledge prerequisite check: {
  originalPassed: false,
  originalScore: 40,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: 1 passed interventions
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Alphabet Knowledge final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied - allowing Decoding
[AUTO PROCESSOR] 🔍 Phonological Awareness prerequisite check: {
  originalPassed: false,
  originalScore: 0,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Phonological Awareness: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Phonological Awareness: 1 passed interventions
[AUTO PROCESSOR] 🔍 Phonological Awareness: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Phonological Awareness: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Phonological Awareness final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Phonological Awareness: Prerequisite satisfied - allowing Decoding
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Decoding: 15 questions required
[COMPLETENESS VALIDATION] Decoding COMPLETE: 45/15 questions answered
[AUTO PROCESSOR]        ✅ Decoding is complete - generating category result...
[CATEGORY RESULTS] Generating category results from responses for student 202533333
[CATEGORY RESULTS] Found student 202533333 with reading level: At Grade Level
[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)
[CATEGORY RESULTS] Required categories for At Grade Level: [Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension]
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 76/15 questions answered
[CATEGORY RESULTS] Alphabet Knowledge: COMPLETE (76/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Phonological Awareness: 6 questions required
[COMPLETENESS VALIDATION] Phonological Awareness COMPLETE: 25/6 questions answered
[CATEGORY RESULTS] Phonological Awareness: COMPLETE (25/6)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Decoding: 15 questions required
[COMPLETENESS VALIDATION] Decoding COMPLETE: 45/15 questions answered
[CATEGORY RESULTS] Decoding: COMPLETE (45/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Word Recognition: 15 questions required
[COMPLETENESS VALIDATION] Word Recognition COMPLETE: 30/15 questions answered
[CATEGORY RESULTS] Word Recognition: COMPLETE (30/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Reading Comprehension: 10 questions required
[COMPLETENESS VALIDATION] Reading Comprehension COMPLETE: 10/10 questions answered
[CATEGORY RESULTS] Reading Comprehension: COMPLETE (10/10)
[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION
[CATEGORY RESULTS] Found 15 responses for student 202533333 at reading level At Grade Level
[CATEGORY RESULTS] 🔍 DEBUG: Found responses for categories: [Decoding]
[CATEGORY RESULTS] 🔍 DEBUG: Phonological Awareness responses: 0
[CATEGORY RESULTS] 🔍 DEBUG: Query used: {"studentId":202533333,"readingLevel":"At Grade Level","category":"Decoding"}
[CATEGORY RESULTS] ⏭️  Skipping Alphabet Knowledge (processing specific category: Decoding)
[CATEGORY RESULTS] ⏭️  Skipping Phonological Awareness (processing specific category: Decoding)
[CATEGORY RESULTS] Processing 15 responses for Decoding
[AUTO-FIX] ⚠️ No main assessment found for Decoding, using response count
[AUTO-FIX] Decoding: Using 15 total questions (0 from main assessment, 15 responses)
[CATEGORY RESULTS] ⏭️  Skipping Word Recognition (processing specific category: Decoding)
[CATEGORY RESULTS] ⏭️  Skipping Reading Comprehension (processing specific category: Decoding)
[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS
Fetching category results for student ID: 202533333
Found 1 category results for student: 202533333
[NORMALIZE] ✅ Alphabet Knowledge: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Phonological Awareness: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Decoding: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Word Recognition: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Reading Comprehension: PASSED INTERVENTION - interventionRequired: false
[CATEGORY RESULTS] ⚠️  EXISTING RECORDS FOUND - CHECKING IF MODIFICATION IS ALLOWED
[CATEGORY RESULTS] 📊 Found 1 existing records for student 202533333
[CATEGORY RESULTS] ✅ CURRENT LEVEL RECORD FOUND - Checking modification permissions
[CATEGORY RESULTS] 🚫 PROGRESSION COMPLETED - Cannot modify record with allCategoriesPassed=true
[CATEGORY RESULTS] ✅ This record has completed its level progression - skipping modification
[AUTO PROCESSOR]    ✅ Decoding: PROCESSED
[AUTO PROCESSOR]    🔍 Processing category 4/5: Word Recognition
[AUTO PROCESSOR] ⚠️  Word Recognition: NO ANALYSIS FOUND - Category complete but no prescriptive analysis exists, generating...
[AUTO PROCESSOR] 🔍 Checking prerequisites for Word Recognition: [Alphabet Knowledge, Phonological Awareness, Decoding]
[AUTO PROCESSOR] 🔍 Alphabet Knowledge prerequisite check: {
  originalPassed: false,
  originalScore: 40,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: 1 passed interventions
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Alphabet Knowledge final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied - allowing Word Recognition
[AUTO PROCESSOR] 🔍 Phonological Awareness prerequisite check: {
  originalPassed: false,
  originalScore: 0,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Phonological Awareness: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Phonological Awareness: 1 passed interventions
[AUTO PROCESSOR] 🔍 Phonological Awareness: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Phonological Awareness: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Phonological Awareness final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Phonological Awareness: Prerequisite satisfied - allowing Word Recognition
[AUTO PROCESSOR] 🔍 Decoding prerequisite check: {
  originalPassed: false,
  originalScore: 40,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Decoding: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Decoding: 1 passed interventions
[AUTO PROCESSOR] 🔍 Decoding: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Decoding: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Decoding final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Decoding: Prerequisite satisfied - allowing Word Recognition
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Word Recognition: 15 questions required
[COMPLETENESS VALIDATION] Word Recognition COMPLETE: 30/15 questions answered
[AUTO PROCESSOR]        ✅ Word Recognition is complete - generating category result...
[CATEGORY RESULTS] Generating category results from responses for student 202533333
[CATEGORY RESULTS] Found student 202533333 with reading level: At Grade Level
[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)
[CATEGORY RESULTS] Required categories for At Grade Level: [Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension]
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 76/15 questions answered
[CATEGORY RESULTS] Alphabet Knowledge: COMPLETE (76/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Phonological Awareness: 6 questions required
[COMPLETENESS VALIDATION] Phonological Awareness COMPLETE: 25/6 questions answered
[CATEGORY RESULTS] Phonological Awareness: COMPLETE (25/6)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Decoding: 15 questions required
[COMPLETENESS VALIDATION] Decoding COMPLETE: 45/15 questions answered
[CATEGORY RESULTS] Decoding: COMPLETE (45/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Word Recognition: 15 questions required
[COMPLETENESS VALIDATION] Word Recognition COMPLETE: 30/15 questions answered
[CATEGORY RESULTS] Word Recognition: COMPLETE (30/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Reading Comprehension: 10 questions required
[COMPLETENESS VALIDATION] Reading Comprehension COMPLETE: 10/10 questions answered
[CATEGORY RESULTS] Reading Comprehension: COMPLETE (10/10)
[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION
[CATEGORY RESULTS] Found 15 responses for student 202533333 at reading level At Grade Level
[CATEGORY RESULTS] 🔍 DEBUG: Found responses for categories: [Word Recognition]
[CATEGORY RESULTS] 🔍 DEBUG: Phonological Awareness responses: 0
[CATEGORY RESULTS] 🔍 DEBUG: Query used: {"studentId":202533333,"readingLevel":"At Grade Level","category":"Word Recognition"}
[CATEGORY RESULTS] ⏭️  Skipping Alphabet Knowledge (processing specific category: Word Recognition)
[CATEGORY RESULTS] ⏭️  Skipping Phonological Awareness (processing specific category: Word Recognition)
[CATEGORY RESULTS] ⏭️  Skipping Decoding (processing specific category: Word Recognition)
[CATEGORY RESULTS] Processing 15 responses for Word Recognition
[AUTO-FIX] ⚠️ No main assessment found for Word Recognition, using response count
[AUTO-FIX] Word Recognition: Using 15 total questions (0 from main assessment, 15 responses)
[CATEGORY RESULTS] ⏭️  Skipping Reading Comprehension (processing specific category: Word Recognition)
[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS
Fetching category results for student ID: 202533333
Found 1 category results for student: 202533333
[NORMALIZE] ✅ Alphabet Knowledge: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Phonological Awareness: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Decoding: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Word Recognition: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Reading Comprehension: PASSED INTERVENTION - interventionRequired: false
[CATEGORY RESULTS] ⚠️  EXISTING RECORDS FOUND - CHECKING IF MODIFICATION IS ALLOWED
[CATEGORY RESULTS] 📊 Found 1 existing records for student 202533333
[CATEGORY RESULTS] ✅ CURRENT LEVEL RECORD FOUND - Checking modification permissions
[CATEGORY RESULTS] 🚫 PROGRESSION COMPLETED - Cannot modify record with allCategoriesPassed=true
[CATEGORY RESULTS] ✅ This record has completed its level progression - skipping modification
[AUTO PROCESSOR]    ✅ Word Recognition: PROCESSED
[AUTO PROCESSOR]    🔍 Processing category 5/5: Reading Comprehension
[AUTO PROCESSOR] ⚠️  Reading Comprehension: NO ANALYSIS FOUND - Category complete but no prescriptive analysis exists, generating...
[AUTO PROCESSOR] 🔍 Checking prerequisites for Reading Comprehension: [Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition]
[AUTO PROCESSOR] 🔍 Alphabet Knowledge prerequisite check: {
  originalPassed: false,
  originalScore: 40,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: 1 passed interventions
[AUTO PROCESSOR] 🔍 Alphabet Knowledge: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Alphabet Knowledge final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Alphabet Knowledge: Prerequisite satisfied - allowing Reading Comprehension
[AUTO PROCESSOR] 🔍 Phonological Awareness prerequisite check: {
  originalPassed: false,
  originalScore: 0,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Phonological Awareness: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Phonological Awareness: 1 passed interventions
[AUTO PROCESSOR] 🔍 Phonological Awareness: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Phonological Awareness: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Phonological Awareness final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Phonological Awareness: Prerequisite satisfied - allowing Reading Comprehension
[AUTO PROCESSOR] 🔍 Decoding prerequisite check: {
  originalPassed: false,
  originalScore: 40,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Decoding: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Decoding: 1 passed interventions
[AUTO PROCESSOR] 🔍 Decoding: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Decoding: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Decoding final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Decoding: Prerequisite satisfied - allowing Reading Comprehension
[AUTO PROCESSOR] 🔍 Word Recognition prerequisite check: {
  originalPassed: false,
  originalScore: 53,
  hasInterventionHistory: true,
  interventionCount: 2
}
[AUTO PROCESSOR] 🔍 Word Recognition: Found 2 intervention attempts
[AUTO PROCESSOR] 🔍 Word Recognition: 1 passed interventions
[AUTO PROCESSOR] 🔍 Word Recognition: Highest intervention score: 100%
[AUTO PROCESSOR] ✅ Word Recognition: Prerequisite satisfied via intervention (100%)
[AUTO PROCESSOR] 🔍 Word Recognition final result: effectivePassed=true, effectiveScore=100
[AUTO PROCESSOR] ✅ Word Recognition: Prerequisite satisfied - allowing Reading Comprehension
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Reading Comprehension: 10 questions required
[COMPLETENESS VALIDATION] Reading Comprehension COMPLETE: 10/10 questions answered
[AUTO PROCESSOR]        ✅ Reading Comprehension is complete - generating category result...
[CATEGORY RESULTS] Generating category results from responses for student 202533333
[CATEGORY RESULTS] Found student 202533333 with reading level: At Grade Level
[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)
[CATEGORY RESULTS] Required categories for At Grade Level: [Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension]
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 76/15 questions answered
[CATEGORY RESULTS] Alphabet Knowledge: COMPLETE (76/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Phonological Awareness: 6 questions required
[COMPLETENESS VALIDATION] Phonological Awareness COMPLETE: 25/6 questions answered
[CATEGORY RESULTS] Phonological Awareness: COMPLETE (25/6)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Decoding: 15 questions required
[COMPLETENESS VALIDATION] Decoding COMPLETE: 45/15 questions answered
[CATEGORY RESULTS] Decoding: COMPLETE (45/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[COMPLETENESS VALIDATION] Checking Word Recognition: 15 questions required
[IEP AUTO GEN] 🔍 Checking for students with missing IEP reports...
[COMPLETENESS VALIDATION] Word Recognition COMPLETE: 30/15 questions answered
[CATEGORY RESULTS] Word Recognition: COMPLETE (30/15)
[COMPLETENESS VALIDATION] Checking completeness for student 202533333, level At Grade Level
[IEP AUTO GEN] Found 2 category results to process
[COMPLETENESS VALIDATION] Checking Reading Comprehension: 10 questions required
[COMPLETENESS VALIDATION] Reading Comprehension COMPLETE: 10/10 questions answered
[CATEGORY RESULTS] Reading Comprehension: COMPLETE (10/10)
[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION
[IEP AUTO GEN] 🔄 Updating existing IEP report for Philip Pangilinan (202533333)
[IEP AUTO GEN] 🔄 Updating existing IEP report...
[IEP AUTO GEN] 📊 Processing category: Alphabet Knowledge
[CATEGORY RESULTS] Found 10 responses for student 202533333 at reading level At Grade Level
[CATEGORY RESULTS] 🔍 DEBUG: Found responses for categories: [Reading Comprehension]
[CATEGORY RESULTS] 🔍 DEBUG: Phonological Awareness responses: 0
[CATEGORY RESULTS] 🔍 DEBUG: Query used: {"studentId":202533333,"readingLevel":"At Grade Level","category":"Reading Comprehension"}
[CATEGORY RESULTS] ⏭️  Skipping Alphabet Knowledge (processing specific category: Reading Comprehension)
[CATEGORY RESULTS] ⏭️  Skipping Phonological Awareness (processing specific category: Reading Comprehension)
[CATEGORY RESULTS] ⏭️  Skipping Decoding (processing specific category: Reading Comprehension)
[CATEGORY RESULTS] ⏭️  Skipping Word Recognition (processing specific category: Reading Comprehension)
[CATEGORY RESULTS] Processing 10 responses for Reading Comprehension
[AUTO-FIX] ⚠️ No main assessment found for Reading Comprehension, using response count
[AUTO-FIX] Reading Comprehension: Using 10 total questions (0 from main assessment, 10 responses)
[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS
Fetching category results for student ID: 202533333
Found 1 category results for student: 202533333
[NORMALIZE] ✅ Alphabet Knowledge: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Phonological Awareness: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Decoding: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Word Recognition: PASSED INTERVENTION - interventionRequired: false
[NORMALIZE] ✅ Reading Comprehension: PASSED INTERVENTION - interventionRequired: false
[CATEGORY RESULTS] ⚠️  EXISTING RECORDS FOUND - CHECKING IF MODIFICATION IS ALLOWED
[CATEGORY RESULTS] 📊 Found 1 existing records for student 202533333
[CATEGORY RESULTS] ✅ CURRENT LEVEL RECORD FOUND - Checking modification permissions
[CATEGORY RESULTS] 🚫 PROGRESSION COMPLETED - Cannot modify record with allCategoriesPassed=true
[CATEGORY RESULTS] ✅ This record has completed its level progression - skipping modification
[AUTO PROCESSOR]    ✅ Reading Comprehension: PROCESSED
[AUTO PROCESSOR]    📊 Summary: 5 processed, 0 blocked
[AUTO PROCESSOR] 📋 Checking student: Kit Santiago (202522233) - Low Emerging
[AUTO PROCESSOR]    📚 Categories for Low Emerging: [Alphabet Knowledge]
[AUTO PROCESSOR]    🔍 Processing category 1/1: Alphabet Knowledge
[IEP AUTO GEN] ✅ Generated objective for Alphabet Knowledge: in_progress (40%)
[IEP AUTO GEN] 📊 Processing category: Phonological Awareness
[AUTO PROCESSOR] ⚠️  Alphabet Knowledge: NO ANALYSIS FOUND - Category complete but no prescriptive analysis exists, generating...
[COMPLETENESS VALIDATION] Checking completeness for student 202522233, level Low Emerging
[IEP AUTO GEN] ✅ Generated objective for Phonological Awareness: in_progress (0%)
[IEP AUTO GEN] 📊 Processing category: Decoding
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 15/15 questions answered
[AUTO PROCESSOR]        ✅ Alphabet Knowledge is complete - generating category result...
[CATEGORY RESULTS] Generating category results from responses for student 202522233
[IEP AUTO GEN] ✅ Generated objective for Decoding: in_progress (40%)
[IEP AUTO GEN] 📊 Processing category: Word Recognition
[CATEGORY RESULTS] Found student 202522233 with reading level: Low Emerging
[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)
[CATEGORY RESULTS] Required categories for Low Emerging: [Alphabet Knowledge]
[COMPLETENESS VALIDATION] Checking completeness for student 202522233, level Low Emerging
[COMPLETENESS VALIDATION] Checking Alphabet Knowledge: 15 questions required
[IEP AUTO GEN] ✅ Generated objective for Word Recognition: in_progress (53%)
[IEP AUTO GEN] 📊 Processing category: Reading Comprehension
[COMPLETENESS VALIDATION] Alphabet Knowledge COMPLETE: 15/15 questions answered
[CATEGORY RESULTS] Alphabet Knowledge: COMPLETE (15/15)
[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION
[CATEGORY RESULTS] Found 15 responses for student 202522233 at reading level Low Emerging
[CATEGORY RESULTS] 🔍 DEBUG: Found responses for categories: [Alphabet Knowledge]
[CATEGORY RESULTS] 🔍 DEBUG: Phonological Awareness responses: 0
[CATEGORY RESULTS] 🔍 DEBUG: Query used: {"studentId":202522233,"readingLevel":"Low Emerging","category":"Alphabet Knowledge"}
[CATEGORY RESULTS] Processing 15 responses for Alphabet Knowledge
[IEP AUTO GEN] ✅ Generated objective for Reading Comprehension: in_progress (0%)
[AUTO-FIX] ⚠️ No main assessment found for Alphabet Knowledge, using response count
[AUTO-FIX] Alphabet Knowledge: Using 15 total questions (0 from main assessment, 15 responses)
[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS
Fetching category results for student ID: 202522233
[IEP AUTO GEN] ✅ IEP report updated with 5 objectives
Found 1 category results for student: 202522233
[NORMALIZE] ❌ Alphabet Knowledge: NEEDS INTERVENTION (7%) - interventionRequired: true
[CATEGORY RESULTS] ⚠️  EXISTING RECORDS FOUND - CHECKING IF MODIFICATION IS ALLOWED
[CATEGORY RESULTS] 📊 Found 1 existing records for student 202522233
[CATEGORY RESULTS] ✅ CURRENT LEVEL RECORD FOUND - Checking modification permissions
[CATEGORY RESULTS] ✅ VALIDATION PASSED - Safe to modify current level record
[CATEGORY RESULTS] 🔄 Category-specific update for: Alphabet Knowledge
[CATEGORY RESULTS] 🔄 Updating Alphabet Knowledge with new response data
[CATEGORY RESULTS] Updating category result 68da3a88ac4062854dba9b71
[NORMALIZE] ❌ Alphabet Knowledge: NEEDS INTERVENTION (7%) - interventionRequired: true
[COMPLETION DETECTION] ❌ Alphabet Knowledge: INCOMPLETE (score: 7%, interventions: 0)
[OVERALL STATS] DEBUG Alphabet Knowledge: {
  originalScore: 7,
  mainAssessmentPassed: false,
  interventionHistory: [],
  hasSuccessfulIntervention: false
}
[OVERALL STATS] ⚪ Using original score for Alphabet Knowledge: 7%
[OVERALL STATS] 📊 Final score for Alphabet Knowledge: 7% (original)
[OVERALL STATS] ✅ ENHANCED CALCULATION: 7% average of [7]
[OVERALL STATS] Passed: 0, Failed: 1, Total: 1
[IEP AUTO GEN] 🔄 Updating existing IEP report for Kit Santiago (202522233)
[IEP AUTO GEN] 🔄 Updating existing IEP report...
[IEP AUTO GEN] 📊 Processing category: Alphabet Knowledge
[IEP AUTO GEN] ✅ Generated objective for Alphabet Knowledge: in_progress (7%)
[CATEGORY RESULTS] Successfully updated category result 68da3a88ac4062854dba9b71
[INTEGRATION TRIGGER] Triggering prescriptive analysis for student 202522233, reading level: Low Emerging
[IEP AUTO GEN] ✅ IEP report updated with 1 objectives
[IEP AUTO GEN] ✅ Missing IEP reports generation completed
[INTEGRATION TRIGGER] Verifying completeness of analysis 68db048dcd46c7ccb8517993
[INTEGRATION TRIGGER] Completed categories: [Alphabet Knowledge]
[INTEGRATION TRIGGER] ✅ Category Alphabet Knowledge has complete data - totalQuestions: 15, responseHistory: 15
[INTEGRATION TRIGGER] ✅ Analysis is complete for all 1 categories
[INTEGRATION TRIGGER] Complete prescriptive analysis already exists for category result 68da3a88ac4062854dba9b71
[CATEGORY RESULTS] ✅ Successfully UPDATED existing category results with intervention preservation for student 202522233
[CATEGORY RESULTS] Record ID: 68da3a88ac4062854dba9b71
[CATEGORY RESULTS] Categories: Alphabet Knowledge (15Q, 0 interventions)
[AUTO PROCESSOR]    ✅ Alphabet Knowledge: PROCESSED
[AUTO PROCESSOR]    📊 Summary: 1 processed, 0 blocked
[AUTO PROCESSOR] 🏁 Batch processing complete:
[AUTO PROCESSOR]    ✅ Processed: 2
[AUTO PROCESSOR]    ⏭️  Skipped (already done): 0
[AUTO PROCESSOR]    ⚠️  Incomplete: 0
ubuntu@ip-172-31-30-162:~/Dyslexia/backend$



PS C:\CapstoneProject\LITEREXIA\backend> npm start

> backend@1.0.0 start
> node server.js     

AWS credentials detected in environment variables
AWS Region: ap-southeast-2  
AWS Bucket: literexia-bucket
Attempting to connect to MongoDB...
node:events:496
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::5001
    at Server.setupListenHandle [as _listen2] (node:net:1937:16)
    at listenInCluster (node:net:1994:12)
    at Server.listen (node:net:2099:7)
    at Object.<anonymous> (C:\CapstoneProject\LITEREXIA\backend\server.js:1271:12)
    at Module._compile (node:internal/modules/cjs/loader:1554:14)
    at Object..js (node:internal/modules/cjs/loader:1706:10)
    at Module.load (node:internal/modules/cjs/loader:1289:32)
    at Function._load (node:internal/modules/cjs/loader:1108:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:220:24)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1973:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '::',
  port: 5001
}

Node.js v22.14.0
PS C:\CapstoneProject\LITEREXIA\backend>