const express = require("express");
const router = express.Router();
const multer = require("multer");
const TicketController = require("../controllers/ticket.controller");

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = 'uploads/temp/';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// SIMPLIFIED Multer configuration - remove file filter for debugging
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Clean filename
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});

// Simple upload without file filter for now
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Submit ticket with file upload
router.post("/submit", upload.array('attachments'), TicketController.submitTicket);

// Get all tickets
router.get("/", TicketController.getTickets);

// Get ticket statistics
router.get("/stats", TicketController.getTicketStats);

// Get categories
router.get("/categories", TicketController.getCategories);

// Get single ticket by ID
router.get("/:id", TicketController.getTicketById);

// Update ticket status
router.put("/:id/status", TicketController.updateTicketStatus);

// Assign ticket
router.put("/:id/assign", TicketController.assignTicket);

// Add response/comment
router.post("/:id/response", TicketController.addResponse);

// Delete ticket
router.delete("/:id", TicketController.deleteTicket);

// File attachment routes
router.post("/:id/attachments", upload.array('files'), TicketController.addAttachments);
router.get("/:id/attachments", TicketController.getAttachments);
router.delete("/:id/attachments/:fileName", TicketController.removeAttachment);

module.exports = router;