const { Notification, User } = require('../schemas');

class NotificationService {
  constructor() {
    console.log('✅ Notification Service initialized');
  }

  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const {
        user,
        type = 'info',
        category = 'general',
        title,
        message,
        priority = 'medium',
        actionUrl,
        actionText,
        metadata = {},
        sentVia = ['in_app'],
        tags = []
      } = notificationData;

      // Validate required fields
      if (!user || !title || !message) {
        throw new Error('User, title, and message are required');
      }

      // Create notification object
      const notification = new Notification({
        user,
        type,
        category,
        title,
        message,
        priority,
        actionUrl,
        actionText,
        metadata,
        sentVia,
        tags,
        deliveryStatus: {
          in_app: {
            sent: sentVia.includes('in_app'),
            deliveredAt: sentVia.includes('in_app') ? new Date() : null
          },
          email: {
            sent: sentVia.includes('email'),
            deliveredAt: sentVia.includes('email') ? new Date() : null
          },
          sms: {
            sent: sentVia.includes('sms'),
            deliveredAt: sentVia.includes('sms') ? new Date() : null
          },
          push: {
            sent: sentVia.includes('push'),
            deliveredAt: sentVia.includes('push') ? new Date() : null
          }
        }
      });

      await notification.save();
      console.log(`✅ Notification created for user ${user}: ${title}`);

      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send notification for document review assignment
   * @param {string} caUserId - CA user ID
   * @param {string} documentId - Document ID
   * @param {string} clientName - Client name
   * @param {string} documentType - Type of document
   * @returns {Promise<Object>} Created notification
   */
  async sendDocumentReviewNotification(caUserId, documentId, clientName, documentType) {
    try {
      const notification = await this.createNotification({
        user: caUserId,
        type: 'alert',
        category: 'document',
        title: 'New Document Review Assignment',
        message: `You have been assigned to review a ${documentType} document for ${clientName}. Please review it as soon as possible.`,
        priority: 'high',
        actionUrl: `/document-review/${documentId}`,
        actionText: 'Review Document',
        metadata: {
          documentId,
          clientName,
          documentType,
          reviewType: 'document_assignment'
        },
        tags: ['document_review', 'assignment', 'urgent']
      });

      console.log(`📋 Document review notification sent to CA user ${caUserId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error sending document review notification:', error);
      throw error;
    }
  }

  /**
   * Send notification for shipment order submission
   * @param {string} caUserId - CA user ID
   * @param {string} orderId - Order ID
   * @param {string} clientName - Client name
   * @returns {Promise<Object>} Created notification
   */
  async sendShipmentOrderNotification(caUserId, orderId, clientName) {
    try {
      const notification = await this.createNotification({
        user: caUserId,
        type: 'alert',
        category: 'document',
        title: 'New Shipment Order for Review',
        message: `A new shipment order from ${clientName} has been submitted for your review. Please process it as soon as possible.`,
        priority: 'high',
        actionUrl: `/shipment-orders/${orderId}`,
        actionText: 'Review Order',
        metadata: {
          orderId,
          clientName,
          reviewType: 'shipment_order'
        },
        tags: ['shipment_order', 'review', 'urgent']
      });

      console.log(`📦 Shipment order notification sent to CA user ${caUserId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error sending shipment order notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        status = 'all',
        category = 'all',
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      // Build query
      let query = { user: userId };
      
      if (status !== 'all') {
        query.status = status;
      }
      
      if (category !== 'all') {
        query.category = category;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder;

      const notifications = await Notification.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('user', 'name email')
        .lean();

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        total,
        hasMore: skip + notifications.length < total
      };
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { 
          status: 'read',
          readAt: new Date()
        },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      console.log(`✅ Notification ${notificationId} marked as read`);
      return notification;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ['$status', 'unread'] }, 1, 0] }
            },
            read: {
              $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
            },
            archived: {
              $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
            },
            highPriority: {
              $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
            },
            urgentPriority: {
              $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        unread: 0,
        read: 0,
        archived: 0,
        highPriority: 0,
        urgentPriority: 0
      };

      return result;
    } catch (error) {
      console.error('❌ Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
