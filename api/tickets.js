// Support tickets API
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { method, query, body } = req;
        const { userId, ticketId, status } = query;

        switch (method) {
            case 'GET':
                if (ticketId) {
                    // Get specific ticket with comments
                    const ticketQuery = `
                        SELECT t.*, 
                               json_agg(
                                   json_build_object(
                                       'id', tc.id,
                                       'comment', tc.comment,
                                       'author_type', tc.author_type,
                                       'author_name', tc.author_name,
                                       'created_at', tc.created_at
                                   ) ORDER BY tc.created_at ASC
                               ) as comments
                        FROM tickets t 
                        LEFT JOIN ticket_comments tc ON t.id = tc.ticket_id 
                        WHERE t.id = $1
                        GROUP BY t.id
                    `;
                    const result = await pool.query(ticketQuery, [ticketId]);
                    
                    if (result.rows.length === 0) {
                        return res.status(404).json({ error: 'Ticket not found' });
                    }

                    const ticket = result.rows[0];
                    // Remove null comments
                    ticket.comments = ticket.comments.filter(comment => comment.id !== null);

                    return res.status(200).json({ ticket });
                } else if (userId) {
                    // Get user's tickets
                    const ticketsQuery = `
                        SELECT t.*, COUNT(tc.id) as comment_count 
                        FROM tickets t 
                        LEFT JOIN ticket_comments tc ON t.id = tc.ticket_id 
                        WHERE t.user_id = $1 
                        GROUP BY t.id 
                        ORDER BY t.created_at DESC
                    `;
                    const result = await pool.query(ticketsQuery, [userId]);
                    return res.status(200).json({ tickets: result.rows });
                } else {
                    // Get all tickets (admin only)
                    const ticketsQuery = `
                        SELECT t.*, COUNT(tc.id) as comment_count 
                        FROM tickets t 
                        LEFT JOIN ticket_comments tc ON t.id = tc.ticket_id 
                        GROUP BY t.id 
                        ORDER BY t.created_at DESC 
                        LIMIT 50
                    `;
                    const result = await pool.query(ticketsQuery);
                    return res.status(200).json({ tickets: result.rows });
                }

            case 'POST':
                if (body.comment && body.ticketId) {
                    // Add comment to existing ticket
                    const { ticketId, comment, author_type, author_name } = body;
                    
                    const commentResult = await pool.query(
                        `INSERT INTO ticket_comments (ticket_id, comment, author_type, author_name, created_at) 
                         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
                        [ticketId, comment, author_type || 'customer', author_name]
                    );
                    
                    // Update ticket's last activity
                    await pool.query(
                        'UPDATE tickets SET updated_at = NOW() WHERE id = $1',
                        [ticketId]
                    );
                    
                    return res.status(201).json({ 
                        comment: commentResult.rows[0], 
                        message: 'Comment added successfully' 
                    });
                } else {
                    // Create new ticket
                    const { user_id, subject, description, priority, customer_email, customer_name } = body;
                    
                    const ticketResult = await pool.query(
                        `INSERT INTO tickets (user_id, subject, description, priority, status, customer_email, customer_name, created_at, updated_at) 
                         VALUES ($1, $2, $3, $4, 'open', $5, $6, NOW(), NOW()) RETURNING *`,
                        [user_id, subject, description, priority || 'medium', customer_email, customer_name]
                    );
                    
                    return res.status(201).json({ 
                        ticket: ticketResult.rows[0], 
                        message: 'Ticket created successfully' 
                    });
                }

            case 'PUT':
                // Update ticket status or details
                if (!ticketId) {
                    return res.status(400).json({ error: 'Ticket ID is required' });
                }
                
                const { status: newStatus, priority, subject } = body;
                let updateQuery = 'UPDATE tickets SET updated_at = NOW()';
                let updateValues = [];
                let valueIndex = 1;
                
                if (newStatus) {
                    updateQuery += `, status = $${valueIndex}`;
                    updateValues.push(newStatus);
                    valueIndex++;
                }
                
                if (priority) {
                    updateQuery += `, priority = $${valueIndex}`;
                    updateValues.push(priority);
                    valueIndex++;
                }
                
                if (subject) {
                    updateQuery += `, subject = $${valueIndex}`;
                    updateValues.push(subject);
                    valueIndex++;
                }
                
                updateQuery += ` WHERE id = $${valueIndex} RETURNING *`;
                updateValues.push(ticketId);
                
                const updateResult = await pool.query(updateQuery, updateValues);
                
                if (updateResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Ticket not found' });
                }
                
                return res.status(200).json({ 
                    ticket: updateResult.rows[0], 
                    message: 'Ticket updated successfully' 
                });

            default:
                res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Tickets API error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}