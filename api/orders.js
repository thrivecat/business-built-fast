// Orders API for customer and admin dashboards
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
        const { userId, orderId, status } = query;

        switch (method) {
            case 'GET':
                if (orderId) {
                    // Get specific order
                    const orderQuery = `
                        SELECT o.*, oi.product_name, oi.price, oi.quantity 
                        FROM orders o 
                        LEFT JOIN order_items oi ON o.id = oi.order_id 
                        WHERE o.id = $1
                    `;
                    const result = await pool.query(orderQuery, [orderId]);
                    
                    if (result.rows.length === 0) {
                        return res.status(404).json({ error: 'Order not found' });
                    }

                    // Group order items
                    const order = {
                        ...result.rows[0],
                        items: result.rows.map(row => ({
                            product_name: row.product_name,
                            price: row.price,
                            quantity: row.quantity
                        }))
                    };

                    return res.status(200).json({ order });
                } else if (userId) {
                    // Get user's orders
                    const ordersQuery = `
                        SELECT o.*, COUNT(oi.id) as item_count 
                        FROM orders o 
                        LEFT JOIN order_items oi ON o.id = oi.order_id 
                        WHERE o.user_id = $1 
                        GROUP BY o.id 
                        ORDER BY o.created_at DESC
                    `;
                    const result = await pool.query(ordersQuery, [userId]);
                    return res.status(200).json({ orders: result.rows });
                } else {
                    // Get all orders (admin only)
                    const ordersQuery = `
                        SELECT o.*, COUNT(oi.id) as item_count 
                        FROM orders o 
                        LEFT JOIN order_items oi ON o.id = oi.order_id 
                        GROUP BY o.id 
                        ORDER BY o.created_at DESC 
                        LIMIT 50
                    `;
                    const result = await pool.query(ordersQuery);
                    return res.status(200).json({ orders: result.rows });
                }

            case 'POST':
                // Create new order
                const { user_id, customer_email, customer_name, total_amount, status: orderStatus, items } = body;
                
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    
                    // Insert order
                    const orderResult = await client.query(
                        `INSERT INTO orders (user_id, customer_email, customer_name, total_amount, status, created_at) 
                         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
                        [user_id, customer_email, customer_name, total_amount, orderStatus || 'pending']
                    );
                    
                    const orderId = orderResult.rows[0].id;
                    
                    // Insert order items
                    for (const item of items) {
                        await client.query(
                            `INSERT INTO order_items (order_id, product_id, product_name, price, quantity) 
                             VALUES ($1, $2, $3, $4, $5)`,
                            [orderId, item.product_id, item.product_name, item.price, item.quantity]
                        );
                    }
                    
                    await client.query('COMMIT');
                    return res.status(201).json({ orderId, message: 'Order created successfully' });
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                } finally {
                    client.release();
                }

            case 'PUT':
                // Update order status
                if (!orderId || !status) {
                    return res.status(400).json({ error: 'Order ID and status are required' });
                }
                
                const updateResult = await pool.query(
                    'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                    [status, orderId]
                );
                
                if (updateResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Order not found' });
                }
                
                return res.status(200).json({ 
                    order: updateResult.rows[0], 
                    message: 'Order updated successfully' 
                });

            default:
                res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Orders API error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}