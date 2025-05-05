// backend/routes/Teachers/uploadFile.js
const express = require('express');
const router  = express.Router();
const upload  = require('../../middleware/uploads3');

router.post('/upload', upload);

module.exports = router;
