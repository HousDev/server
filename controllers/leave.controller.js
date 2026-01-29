const multer = require('multer');
const path = require('path');
const fs = require('fs');
const LeaveModel = require('../models/leave.model');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/leaves/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

class LeaveController {
  // Upload middleware
  static upload = upload.single('attachment');

  // Apply for leave with half day support
  static async applyLeave(req, res) {
    try {
      const { 
        employee_id, 
        leave_type, 
        from_date, 
        to_date, 
        reason,
        is_half_day = false,
        half_day_period = null
      } = req.body;
      
      // Validate required fields
      if (!employee_id || !leave_type || !from_date || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Please fill all required fields'
        });
      }

      // Validate dates
      const fromDate = new Date(from_date);
      const toDate = new Date(to_date || from_date); // Use from_date if to_date not provided for half day
      
      // Handle half day logic
      const isHalfDay = is_half_day === 'true' || is_half_day === true;
      
      if (isHalfDay) {
        // For half day, validate that dates are the same
        if (from_date !== to_date && to_date) {
          return res.status(400).json({
            success: false,
            message: 'For half day leave, from date and to date must be the same'
          });
        }
        
        // Ensure to_date is same as from_date
        req.body.to_date = from_date;
      } else {
        // For full day, validate to_date is provided
        if (!to_date) {
          return res.status(400).json({
            success: false,
            message: 'Please select to date for full day leave'
          });
        }
        
        if (fromDate > toDate) {
          return res.status(400).json({
            success: false,
            message: 'From date cannot be after to date'
          });
        }
      }

      // Calculate total days
      let totalDays;
      if (isHalfDay) {
        totalDays = 0.5;
      } else {
        const timeDiff = toDate.getTime() - fromDate.getTime();
        totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      }

      if (totalDays <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range'
        });
      }

      // Check if leave is more than 30 days (only for full days)
      if (!isHalfDay && totalDays > 30) {
        return res.status(400).json({
          success: false,
          message: 'Leave cannot exceed 30 days. Please contact HR for longer leaves.'
        });
      }

      // Check if from date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (fromDate < today) {
        return res.status(400).json({
          success: false,
          message: 'From date cannot be in the past'
        });
      }

      // Prepare leave data
      const leaveData = {
        employee_id,
        leave_type,
        from_date,
        to_date: isHalfDay ? from_date : to_date, // Ensure same date for half day
        total_days: totalDays,
        reason,
        status: 'pending',
        is_half_day: isHalfDay,
        half_day_period: isHalfDay ? half_day_period : null
      };

      // Add file data if uploaded
      if (req.file) {
        leaveData.attachment_path = req.file.path.replace(/\\/g, '/');
        leaveData.attachment_name = req.file.originalname;
        leaveData.attachment_type = req.file.mimetype;
        leaveData.attachment_size = req.file.size;
      }

      // Create leave application
      const result = await LeaveModel.createLeave(leaveData);

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: {
          id: result.id,
          application_number: result.application_number,
          is_half_day: isHalfDay,
          total_days: totalDays
        }
      });

    } catch (error) {
      console.error('Apply leave error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit leave application'
      });
    }
  }

  // Get all leaves
  static async getLeaves(req, res) {
    try {
      const { 
        status, 
        leave_type, 
        start_date, 
        end_date, 
        search,
        is_half_day,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {};

      // Apply filters
      if (status) filters.status = status;
      if (leave_type) filters.leave_type = leave_type;
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;
      if (search) filters.search = search;
      if (is_half_day !== undefined) filters.is_half_day = is_half_day;

      // Add pagination
      filters.limit = parseInt(limit);
      filters.offset = (parseInt(page) - 1) * parseInt(limit);

      // Get leaves
      const leaves = await LeaveModel.getAllLeaves(filters);
      const total = await LeaveModel.getLeaveCount(filters);

      return res.status(200).json({
        success: true,
        data: leaves,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get leaves error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch leaves'
      });
    }
  }

  // Get leave by ID
  static async getLeaveById(req, res) {
    try {
      const { id } = req.params;

      const leave = await LeaveModel.getLeaveById(id);
      
      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: leave
      });

    } catch (error) {
      console.error('Get leave by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch leave'
      });
    }
  }

  // Get leave statistics
  static async getLeaveStats(req, res) {
    try {
      const stats = await LeaveModel.getLeaveStats();
      const onLeaveToday = await LeaveModel.getOnLeaveToday();

      return res.status(200).json({
        success: true,
        data: {
          pending: stats.pending || 0,
          approved: stats.approved || 0,
          rejected: stats.rejected || 0,
          total: stats.total || 0,
          onLeave: onLeaveToday || 0,
          half_day_total: stats.half_day_total || 0,
          half_day_pending: stats.half_day_pending || 0,
          half_day_approved: stats.half_day_approved || 0,
          half_day_rejected: stats.half_day_rejected || 0
        }
      });

    } catch (error) {
      console.error('Get leave stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch leave statistics'
      });
    }
  }

  // Approve leave
  static async approveLeave(req, res) {
    try {
      const { id } = req.params;
      const { user_id, username, name } = req.body;
      
      console.log('Approve request data:', { id, user_id, username, name });
      
      // Prepare user data object with both ID and username
      const userData = {
        user_id: user_id,
        username: username || user_id,
        name: name || 'Admin User'
      };
      
      // Check if leave exists
      const leave = await LeaveModel.getLeaveById(id);
      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave not found'
        });
      }

      // Check if already approved/rejected
      if (leave.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Leave is already approved'
        });
      }

      if (leave.status === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve a rejected leave'
        });
      }

      // Approve the leave
      const success = await LeaveModel.updateLeaveStatus(id, 'approved', userData);

      if (success) {
        return res.status(200).json({
          success: true,
          message: 'Leave approved successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to approve leave'
        });
      }

    } catch (error) {
      console.error('Approve leave error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve leave'
      });
    }
  }

  // Reject leave
  static async rejectLeave(req, res) {
    try {
      const { id } = req.params;
      const { user_id, username, name, rejection_reason } = req.body;

      if (!rejection_reason || rejection_reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      console.log('Reject request data:', { id, user_id, username, name, rejection_reason });

      // Prepare user data object with both ID and username
      const userData = {
        user_id: user_id,
        username: username || user_id,
        name: name || 'Admin User'
      };

      // Check if leave exists
      const leave = await LeaveModel.getLeaveById(id);
      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave not found'
        });
      }

      // Check if already approved/rejected
      if (leave.status === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Leave is already rejected'
        });
      }

      if (leave.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot reject an approved leave'
        });
      }

      // Reject the leave
      const success = await LeaveModel.updateLeaveStatus(id, 'rejected', userData, rejection_reason);

      if (success) {
        return res.status(200).json({
          success: true,
          message: 'Leave rejected successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to reject leave'
        });
      }

    } catch (error) {
      console.error('Reject leave error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject leave'
    });
    }
  }

  // Download attachment
  static async downloadAttachment(req, res) {
    try {
      const { id } = req.params;

      const leave = await LeaveModel.getLeaveById(id);
      
      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave not found'
        });
      }

      if (!leave.attachment_path) {
        return res.status(404).json({
          success: false,
          message: 'No attachment found for this leave'
        });
      }

      // Check if file exists
      if (!fs.existsSync(leave.attachment_path)) {
        return res.status(404).json({
          success: false,
          message: 'Attachment file not found on server'
        });
      }

      // Set headers for download
      const fileName = leave.attachment_name || 'leave_document';
      const fileExtension = path.extname(leave.attachment_path);
      const fullFileName = fileName + fileExtension;

      // Determine content type
      let contentType = 'application/octet-stream';
      if (leave.attachment_type) {
        contentType = leave.attachment_type;
      } else if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (fileExtension === '.png') {
        contentType = 'image/png';
      }

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fullFileName}"`);
      
      // Send the file
      res.download(leave.attachment_path, fullFileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: 'Failed to download file'
            });
          }
        }
      });

    } catch (error) {
      console.error('Download attachment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to download attachment'
      });
    }
  }

  // Delete leave
  static async deleteLeave(req, res) {
    try {
      const { id } = req.params;

      // Check if leave exists
      const leave = await LeaveModel.getLeaveById(id);
      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave not found'
        });
      }

      // Delete attachment file if exists
      if (leave.attachment_path && fs.existsSync(leave.attachment_path)) {
        fs.unlinkSync(leave.attachment_path);
      }

      // Delete from database
      const [result] = await promisePool.query(
        'DELETE FROM hrms_leaves WHERE id = ?',
        [id]
      );

      if (result.affectedRows > 0) {
        return res.status(200).json({
          success: true,
          message: 'Leave deleted successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete leave'
        });
      }

    } catch (error) {
      console.error('Delete leave error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete leave'
      });
    }
  }
}

module.exports = LeaveController;