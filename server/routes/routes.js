const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const leaveController = require('../controllers/leaveController');
const { verifyUser } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes pour les utilisateurs
router.get('/users', verifyUser('admin'), userController.getAllUsers);
router.post('/users', verifyUser('admin'), userController.createUser);
router.put('/users/:uid', verifyUser('admin'), userController.updateUser);
router.delete('/users/:uid', verifyUser('admin'), userController.deleteUser);
router.get('/users/:uid/leave-balance', verifyUser(['agent', 'manager', 'admin']), userController.getLeaveBalance);

// Routes pour les congés
router.get('/leaves', verifyUser('admin'), leaveController.getAllLeaves);
router.get('/leaves/user/:userId', verifyUser(['agent', 'manager', 'admin']), leaveController.getUserLeaves);
router.post('/leaves', verifyUser(['agent', 'manager']), upload.single('attachment'), leaveController.createLeave);
router.put('/leaves/:id', verifyUser('admin'), leaveController.updateLeave);

module.exports = router;