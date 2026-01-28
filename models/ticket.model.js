const { query } = require("../config/db");

class TicketModel {
    // Generate ticket number
    static async generateTicketNumber() {
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        
        const result = await query(
            `SELECT ticket_number 
             FROM hrms_tickets 
             WHERE ticket_number LIKE CONCAT('TKT-', ?, '-%')
             ORDER BY ticket_number DESC 
             LIMIT 1`,
            [yearMonth]
        );
        
        let nextSeq = 1;
        
        if (result.length > 0 && result[0].ticket_number) {
            const lastTicketNumber = result[0].ticket_number;
            const parts = lastTicketNumber.split('-');
            if (parts.length >= 3) {
                const lastSeq = parseInt(parts[2]) || 0;
                nextSeq = lastSeq + 1;
            }
        }
        
        return `TKT-${yearMonth}-${nextSeq.toString().padStart(4, '0')}`;
    }

    // Create ticket with attachments
    static async createTicket(ticketData, attachments = []) {
        try {
            console.log('Creating ticket with data:', ticketData);
            console.log('Attachments count:', attachments.length);
            
            const ticketNumber = await this.generateTicketNumber();
            
            // Prepare attachments data
            const attachmentsJson = attachments.length > 0 
                ? JSON.stringify(attachments) 
                : '[]';
            
            const attachmentsCount = attachments.length;

            console.log('Ticket number:', ticketNumber);
            console.log('Attachments JSON:', attachmentsJson);
            console.log('Attachments count:', attachmentsCount);

            const result = await query(
                `INSERT INTO hrms_tickets 
                (ticket_number, employee_id, employee_name, employee_department, employee_designation,
                 category, subject, description, priority, status, assigned_to_id, assigned_to_name,
                 response_count, last_response_at, resolved_at, attachments, attachments_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ticketNumber,
                    ticketData.employee_id,
                    ticketData.employee_name || '',
                    ticketData.employee_department || '',
                    ticketData.employee_designation || '',
                    ticketData.category,
                    ticketData.subject,
                    ticketData.description,
                    ticketData.priority || 'medium',
                    ticketData.status || 'open',
                    ticketData.assigned_to_id || null,
                    ticketData.assigned_to_name || null,
                    0, // response_count
                    null, // last_response_at
                    null, // resolved_at
                    attachmentsJson, // attachments JSON
                    attachmentsCount // attachments_count
                ]
            );

            console.log('Insert result:', result);

            return {
                id: result.insertId,
                ticket_number: ticketNumber
            };
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    }

    // Get all tickets with filters - FIXED VERSION
    static async getAllTickets(filters = {}) {
        try {
            // Build WHERE clause
            let conditions = [];
            let params = [];

            if (filters.status) {
                conditions.push("status = ?");
                params.push(filters.status);
            }

            if (filters.category) {
                conditions.push("category = ?");
                params.push(filters.category);
            }

            if (filters.employee_id) {
                conditions.push("employee_id = ?");
                params.push(filters.employee_id);
            }

            if (filters.priority) {
                conditions.push("priority = ?");
                params.push(filters.priority);
            }

            if (filters.assigned_to_id) {
                conditions.push("assigned_to_id = ?");
                params.push(filters.assigned_to_id);
            }

            if (filters.search) {
                conditions.push(`(
                    ticket_number LIKE ? OR 
                    subject LIKE ? OR 
                    description LIKE ? OR
                    employee_name LIKE ?
                )`);
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

            // Get total count
            const countResult = await query(
                `SELECT COUNT(*) as total FROM hrms_tickets ${whereClause}`,
                params
            );

            // Build SQL query
            let sql = `SELECT * FROM hrms_tickets ${whereClause} ORDER BY created_at DESC`;
            
            // Add pagination
            const limit = parseInt(filters.limit) || 50;
            const offset = parseInt(filters.offset) || 0;
            
            if (limit > 0) {
                sql += ` LIMIT ${limit}`;
                if (offset > 0) {
                    sql += ` OFFSET ${offset}`;
                }
            }

            console.log('Get tickets SQL:', sql);
            console.log('Get tickets params:', params);

            // Get data
            const rows = await query(sql, params);

            // Parse attachments JSON safely - FIXED VERSION
            const parsedRows = rows.map(row => {
                try {
                    let attachments = [];
                    let attachmentsCount = 0;
                    
                    if (row.attachments) {
                        // Handle different cases
                        if (typeof row.attachments === 'string') {
                            try {
                                attachments = JSON.parse(row.attachments);
                                if (!Array.isArray(attachments)) {
                                    attachments = [];
                                }
                            } catch (parseError) {
                                console.error('Error parsing attachments string:', parseError);
                                attachments = [];
                            }
                        } else if (Array.isArray(row.attachments)) {
                            attachments = row.attachments;
                        }
                        
                        attachmentsCount = attachments.length;
                    }
                    
                    // Ensure attachments_count is a number
                    if (row.attachments_count !== null && row.attachments_count !== undefined) {
                        attachmentsCount = parseInt(row.attachments_count) || 0;
                    }

                    return {
                        ...row,
                        attachments: attachments,
                        attachments_count: attachmentsCount
                    };
                } catch (error) {
                    console.error('Error processing row:', error);
                    console.error('Problematic row:', row);
                    return {
                        ...row,
                        attachments: [],
                        attachments_count: 0
                    };
                }
            });

            return {
                data: parsedRows,
                total: countResult[0]?.total || 0,
                page: Math.floor(offset / limit) + 1,
                limit: limit
            };
        } catch (error) {
            console.error('Error getting all tickets:', error);
            throw error;
        }
    }

    // Get ticket by ID - FIXED VERSION
    static async getTicketById(id) {
        try {
            console.log('Getting ticket by ID:', id);
            
            const rows = await query(
                `SELECT * FROM hrms_tickets WHERE id = ?`,
                [id]
            );
            
            console.log('Ticket query result:', rows.length, 'rows found');
            
            if (rows[0]) {
                const row = rows[0];
                console.log('Raw ticket data:', row);
                
                try {
                    let attachments = [];
                    let attachmentsCount = 0;
                    
                    if (row.attachments) {
                        console.log('Raw attachments:', row.attachments);
                        console.log('Attachments type:', typeof row.attachments);
                        
                        if (typeof row.attachments === 'string') {
                            try {
                                attachments = JSON.parse(row.attachments);
                                console.log('Parsed attachments:', attachments);
                                if (!Array.isArray(attachments)) {
                                    console.log('Attachments is not an array, resetting to empty');
                                    attachments = [];
                                }
                            } catch (parseError) {
                                console.error('Error parsing attachments string:', parseError);
                                console.error('Problematic string:', row.attachments);
                                attachments = [];
                            }
                        } else if (Array.isArray(row.attachments)) {
                            attachments = row.attachments;
                        }
                        
                        attachmentsCount = attachments.length;
                    }
                    
                    // Ensure attachments_count is a number
                    if (row.attachments_count !== null && row.attachments_count !== undefined) {
                        attachmentsCount = parseInt(row.attachments_count) || 0;
                    }
                    
                    console.log('Final attachments:', attachments);
                    console.log('Final attachments count:', attachmentsCount);

                    const ticket = {
                        ...row,
                        attachments: attachments,
                        attachments_count: attachmentsCount
                    };
                    
                    console.log('Returning ticket:', ticket);
                    return ticket;
                } catch (parseError) {
                    console.error('Error processing ticket:', parseError);
                    return {
                        ...row,
                        attachments: [],
                        attachments_count: 0
                    };
                }
            }
            console.log('No ticket found for ID:', id);
            return null;
        } catch (error) {
            console.error('Error getting ticket by ID:', error);
            throw error;
        }
    }

    // Get ticket by ticket number
    static async getTicketByNumber(ticketNumber) {
        try {
            const rows = await query(
                `SELECT * FROM hrms_tickets WHERE ticket_number = ?`,
                [ticketNumber]
            );
            
            if (rows[0]) {
                const row = rows[0];
                try {
                    let attachments = [];
                    let attachmentsCount = 0;
                    
                    if (row.attachments && typeof row.attachments === 'string') {
                        attachments = JSON.parse(row.attachments);
                        if (!Array.isArray(attachments)) {
                            attachments = [];
                        }
                        attachmentsCount = attachments.length;
                    }
                    
                    if (row.attachments_count !== null && row.attachments_count !== undefined) {
                        attachmentsCount = parseInt(row.attachments_count) || 0;
                    }

                    return {
                        ...row,
                        attachments: attachments,
                        attachments_count: attachmentsCount
                    };
                } catch (parseError) {
                    console.error('Error parsing attachments:', parseError);
                    return {
                        ...row,
                        attachments: [],
                        attachments_count: 0
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting ticket by number:', error);
            throw error;
        }
    }

    // Update ticket status
    static async updateTicketStatus(id, status, userId = null, userName = null) {
        try {
            let sql = `UPDATE hrms_tickets SET status = ?, updated_at = NOW()`;
            const params = [status];

            if (status === 'resolved' || status === 'closed') {
                sql += `, resolved_at = NOW()`;
            } else if (status === 'in_progress' && userId) {
                sql += `, assigned_to_id = ?, assigned_to_name = ?`;
                params.push(userId, userName);
            }

            sql += ` WHERE id = ?`;
            params.push(id);

            const result = await query(sql, params);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating ticket status:', error);
            throw error;
        }
    }

    // Add attachments to existing ticket
    static async addAttachments(ticketId, newAttachments) {
        try {
            // Get existing ticket
            const ticket = await this.getTicketById(ticketId);
            
            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Merge existing attachments with new ones
            const existingAttachments = ticket.attachments || [];
            const updatedAttachments = [...existingAttachments, ...newAttachments];
            const updatedAttachmentsCount = updatedAttachments.length;

            const result = await query(
                `UPDATE hrms_tickets 
                 SET attachments = ?, 
                     attachments_count = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [
                    JSON.stringify(updatedAttachments),
                    updatedAttachmentsCount,
                    ticketId
                ]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error adding attachments:', error);
            throw error;
        }
    }

    // Remove attachment from ticket
    static async removeAttachment(ticketId, fileName) {
        try {
            const ticket = await this.getTicketById(ticketId);
            
            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Filter out the attachment to remove
            const updatedAttachments = ticket.attachments.filter(
                attachment => attachment.file_name !== fileName
            );
            
            const updatedAttachmentsCount = updatedAttachments.length;

            const result = await query(
                `UPDATE hrms_tickets 
                 SET attachments = ?, 
                     attachments_count = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [
                    JSON.stringify(updatedAttachments),
                    updatedAttachmentsCount,
                    ticketId
                ]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing attachment:', error);
            throw error;
        }
    }

    // Assign ticket to admin/HR
    static async assignTicket(id, assignedToId, assignedToName, assignedById, assignedByName) {
        try {
            const result = await query(
                `UPDATE hrms_tickets 
                 SET assigned_to_id = ?, 
                     assigned_to_name = ?,
                     status = 'in_progress',
                     updated_at = NOW()
                 WHERE id = ?`,
                [assignedToId, assignedToName, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error assigning ticket:', error);
            throw error;
        }
    }

    // Update response count
    static async updateResponseCount(id) {
        try {
            const result = await query(
                `UPDATE hrms_tickets 
                 SET response_count = response_count + 1,
                     last_response_at = NOW(),
                     updated_at = NOW()
                 WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating response count:', error);
            throw error;
        }
    }

    // Get ticket statistics
    static async getTicketStats(employeeId = null) {
        try {
            let whereClause = '';
            let params = [];

            if (employeeId) {
                whereClause = 'WHERE employee_id = ?';
                params.push(employeeId);
            }

            const stats = await query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                    SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
                    SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
                    SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low
                FROM hrms_tickets ${whereClause}
            `, params);

            return stats[0] || {
                total: 0,
                open: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            };
        } catch (error) {
            console.error('Error getting ticket stats:', error);
            throw error;
        }
    }

    // Get categories
    static async getCategories() {
        try {
            const rows = await query(
                `SELECT DISTINCT category 
                 FROM hrms_tickets 
                 WHERE category IS NOT NULL AND category != ''
                 ORDER BY category ASC`
            );
            
            return rows.map(row => row.category) || [];
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    }

    // Delete ticket
    static async deleteTicket(id) {
        try {
            const result = await query(
                'DELETE FROM hrms_tickets WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting ticket:', error);
            throw error;
        }
    }
}

module.exports = TicketModel;