// routes/Teachers/contentRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const contentCategoryController = require('../../controllers/Teachers/ManageProgress/CategoryController');

// Categories routes
router.get('/categories', auth, contentCategoryController.getCategories);

module.exports = router;