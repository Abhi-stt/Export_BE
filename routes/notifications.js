const express = require('express');
const { Notification } = require('../schemas');
const auth = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const router = express.Router();

// Initialize notification service
const notificationService = new NotificationService();

// @route   GET /api/notifications
// @desc    Get user notifications with pagination and filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      status = 'all',
      category = 'all',
      limit = 20,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrderNum = sortOrder === 'asc' ? 1 : -1;

    const result = await notificationService.getUserNotifications(req.user.id, {
      status,
      category,
      limit: parseInt(limit),
      skip,
      sortBy,
      sortOrder: sortOrderNum
    });

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(result.total / parseInt(limit)),
          hasMore: result.hasMore,
          totalItems: result.total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics for user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await notificationService.getNotificationStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message 
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to mark notification as read',
      error: error.message 
    });
  }
});

// @route   POST /api/notifications/document-review
// @desc    Send document review notification
// @access  Private
router.post('/document-review', auth, async (req, res) => {
  try {
    const { caUserId, documentId, clientName, documentType } = req.body;

    if (!caUserId || !documentId || !clientName || !documentType) {
      return res.status(400).json({
        success: false,
        message: 'caUserId, documentId, clientName, and documentType are required'
      });
    }

    const notification = await notificationService.sendDocumentReviewNotification(
      caUserId,
      documentId,
      clientName,
      documentType
    );
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Document review notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending document review notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send document review notification',
      error: error.message 
    });
  }
});

// @route   POST /api/notifications/shipment-order
// @desc    Send shipment order notification
// @access  Private
router.post('/shipment-order', auth, async (req, res) => {
  try {
    const { caUserId, orderId, clientName } = req.body;

    if (!caUserId || !orderId || !clientName) {
      return res.status(400).json({
        success: false,
        message: 'caUserId, orderId, and clientName are required'
      });
    }

    const notification = await notificationService.sendShipmentOrderNotification(
      caUserId,
      orderId,
      clientName
    );
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Shipment order notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending shipment order notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send shipment order notification',
      error: error.message 
    });
  }
});

module.exports = router;