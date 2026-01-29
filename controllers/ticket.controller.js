const TicketModel = require('../models/ticket.model');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class TicketController {
    // Submit ticket with file upload - FIXED VERSION
    static async submitTicket(req, res) {
        console.log('=== SUBMIT TICKET REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Files received:', req.files ? req.files.length : 0);
        
        try {
            const {
                employee_id,
                employee_name,
                employee_department,
                employee_designation,
                category,
                subject,
                description,
                priority
            } = req.body;

            console.log('Parsed data:', {
                employee_id,
                employee_name,
                employee_department,
                employee_designation,
                category,
                subject,
                description,
                priority
            });

            // Validate required fields
            if (!employee_id || !category || !subject || !description) {
                console.log('❌ Validation failed - missing required fields');
                return res.status(400).json({
                    success: false,
                    message: 'Please fill all required fields'
                });
            }

            // Prepare ticket data
            const ticketData = {
                employee_id: parseInt(employee_id),
                employee_name: employee_name?.trim() || '',
                employee_department: employee_department?.trim() || '',
                employee_designation: employee_designation?.trim() || '',
                category: category.trim(),
                subject: subject.trim(),
                description: description.trim(),
                priority: priority || 'medium'
            };

            console.log('✅ Ticket data prepared:', ticketData);

            // Handle file uploads
            const attachments = [];
            
            if (req.files && req.files.length > 0) {
                console.log(`📁 Processing ${req.files.length} files`);
                
                // Create uploads directory if it doesn't exist
                const uploadDir = path.join(__dirname, '..', 'uploads', 'tickets');
                console.log('📁 Upload directory:', uploadDir);
                
                if (!fs.existsSync(uploadDir)) {
                    console.log('📁 Creating upload directory...');
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Process each uploaded file
                for (const file of req.files) {
                    console.log(`📄 Processing file: ${file.originalname} (${file.mimetype})`);
                    
                    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
                    const filePath = path.join(uploadDir, uniqueFileName);
                    
                    console.log(`📁 Moving file to: ${filePath}`);
                    
                    try {
                        // Move file to uploads directory
                        await fs.promises.rename(file.path, filePath);
                        
                        attachments.push({
                            file_name: uniqueFileName,
                            original_name: file.originalname,
                            file_path: `uploads/tickets/${uniqueFileName}`,
                            file_type: file.mimetype,
                            file_size: file.size,
                            uploaded_at: new Date().toISOString()
                        });
                        
                        console.log(`✅ File saved: ${uniqueFileName}`);
                    } catch (fileError) {
                        console.error(`❌ Error moving file ${file.originalname}:`, fileError);
                        throw new Error(`Failed to save file: ${file.originalname}`);
                    }
                }
                
                console.log(`✅ All ${attachments.length} files processed`);
            } else {
                console.log('📁 No files uploaded');
            }

            // Create ticket with attachments
            console.log('💾 Creating ticket in database...');
            const result = await TicketModel.createTicket(ticketData, attachments);
            console.log('✅ Ticket created successfully:', result);

            return res.status(201).json({
                success: true,
                message: 'Ticket created successfully',
                data: {
                    id: result.id,
                    ticket_number: result.ticket_number,
                    attachments_count: attachments.length
                }
            });

        } catch (error) {
            console.error('❌ Submit ticket error:', error);
            console.error('❌ Error stack:', error.stack);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to create ticket',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    // Add attachments to existing ticket
    static async addAttachments(req, res) {
        try {
            const { id } = req.params;
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Check if ticket exists
            const ticket = await TicketModel.getTicketById(id);
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            const newAttachments = [];
            const uploadDir = path.join(__dirname, '..', 'uploads', 'tickets');
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Process each uploaded file
            for (const file of req.files) {
                const uniqueFileName = `${uuidv4()}-${file.originalname}`;
                const filePath = path.join(uploadDir, uniqueFileName);
                
                await fs.promises.rename(file.path, filePath);
                
                newAttachments.push({
                    file_name: uniqueFileName,
                    original_name: file.originalname,
                    file_path: `uploads/tickets/${uniqueFileName}`,
                    file_type: file.mimetype,
                    file_size: file.size,
                    uploaded_at: new Date().toISOString()
                });
            }

            // Add attachments to ticket
            const success = await TicketModel.addAttachments(id, newAttachments);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Files uploaded successfully',
                    data: {
                        attachments_added: newAttachments.length,
                        total_attachments: ticket.attachments_count + newAttachments.length
                    }
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload files'
                });
            }

        } catch (error) {
            console.error('Add attachments error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload files'
            });
        }
    }

    // Remove attachment from ticket
    static async removeAttachment(req, res) {
        try {
            const { id, fileName } = req.params;

            // Check if ticket exists
            const ticket = await TicketModel.getTicketById(id);
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Find the attachment
            const attachment = ticket.attachments.find(
                att => att.file_name === fileName
            );

            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'Attachment not found'
                });
            }

            // Delete file from server
            const filePath = path.join(__dirname, '..', attachment.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Remove attachment from database
            const success = await TicketModel.removeAttachment(id, fileName);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Attachment removed successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to remove attachment'
                });
            }

        } catch (error) {
            console.error('Remove attachment error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to remove attachment'
            });
        }
    }

    // Get ticket attachments
    static async getAttachments(req, res) {
        try {
            const { id } = req.params;

            const ticket = await TicketModel.getTicketById(id);
            
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    attachments: ticket.attachments || [],
                    attachments_count: ticket.attachments_count || 0
                }
            });

        } catch (error) {
            console.error('Get attachments error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch attachments'
            });
        }
    }

    // Get all tickets
    static async getTickets(req, res) {
        try {
            const {
                status,
                category,
                employee_id,
                priority,
                assigned_to_id,
                search,
                page = 1,
                limit = 50
            } = req.query;

            const filters = {};

            // Apply filters
            if (status) filters.status = status;
            if (category) filters.category = category;
            if (employee_id) filters.employee_id = employee_id;
            if (priority) filters.priority = priority;
            if (assigned_to_id) filters.assigned_to_id = assigned_to_id;
            if (search) filters.search = search;

            // Add pagination
            filters.limit = parseInt(limit);
            filters.offset = (parseInt(page) - 1) * parseInt(limit);

            // Get tickets
            const result = await TicketModel.getAllTickets(filters);

            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: Math.ceil(result.total / result.limit)
                }
            });

        } catch (error) {
            console.error('Get tickets error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch tickets'
            });
        }
    }

    // Get ticket by ID
    static async getTicketById(req, res) {
        try {
            const { id } = req.params;

            const ticket = await TicketModel.getTicketById(id);
            
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: ticket
            });

        } catch (error) {
            console.error('Get ticket by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch ticket'
            });
        }
    }

    // Get ticket statistics
    static async getTicketStats(req, res) {
        try {
            const { employee_id } = req.query;
            
            const stats = await TicketModel.getTicketStats(employee_id);

            return res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Get ticket stats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch ticket statistics'
            });
        }
    }

    // Get categories
    static async getCategories(req, res) {
        try {
            const categories = await TicketModel.getCategories();

            return res.status(200).json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error('Get categories error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch categories'
            });
        }
    }

    // Update ticket status
    static async updateTicketStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, user_id, user_name } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            // Check if ticket exists
            const ticket = await TicketModel.getTicketById(id);
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Update ticket status
            const success = await TicketModel.updateTicketStatus(id, status, user_id, user_name);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Ticket status updated successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update ticket status'
                });
            }

        } catch (error) {
            console.error('Update ticket status error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update ticket status'
            });
        }
    }

    // Assign ticket
    static async assignTicket(req, res) {
        try {
            const { id } = req.params;
            const { assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name } = req.body;

            if (!assigned_to_id || !assigned_to_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Assignee details are required'
                });
            }

            // Check if ticket exists
            const ticket = await TicketModel.getTicketById(id);
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Assign ticket
            const success = await TicketModel.assignTicket(id, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Ticket assigned successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to assign ticket'
                });
            }

        } catch (error) {
            console.error('Assign ticket error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to assign ticket'
            });
        }
    }

    // Add response/comment
    static async addResponse(req, res) {
        try {
            const { id } = req.params;

            // Check if ticket exists
            const ticket = await TicketModel.getTicketById(id);
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Update response count
            const success = await TicketModel.updateResponseCount(id);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Response added successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add response'
                });
            }

        } catch (error) {
            console.error('Add response error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to add response'
            });
        }
    }

    // Delete ticket
    static async deleteTicket(req, res) {
        try {
            const { id } = req.params;

            // Get ticket first to delete attached files
            const ticket = await TicketModel.getTicketById(id);
            
            if (ticket && ticket.attachments && ticket.attachments.length > 0) {
                // Delete all attached files
                for (const attachment of ticket.attachments) {
                    const filePath = path.join(__dirname, '..', attachment.file_path);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }

            // Delete ticket
            const success = await TicketModel.deleteTicket(id);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Ticket deleted successfully'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

        } catch (error) {
            console.error('Delete ticket error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete ticket'
            });
        }
    }
}

module.exports = TicketController;