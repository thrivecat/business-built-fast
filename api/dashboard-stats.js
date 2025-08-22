const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const client = await pool.connect();
        
        try {
            // Get customer stats
            const ordersQuery = `
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_spent,
                    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders
                FROM orders 
                WHERE user_id = $1
            `;
            
            const ticketsQuery = `
                SELECT COUNT(*) as open_tickets
                FROM tickets 
                WHERE user_id = $1 AND status = 'open'
            `;

            const [ordersResult, ticketsResult] = await Promise.all([
                client.query(ordersQuery, [userId]),
                client.query(ticketsQuery, [userId])
            ]);

            const orderStats = ordersResult.rows[0];
            const ticketStats = ticketsResult.rows[0];

            const stats = {
                totalOrders: parseInt(orderStats.total_orders) || 0,
                totalSpent: parseFloat(orderStats.total_spent) || 0,
                completedOrders: parseInt(orderStats.completed_orders) || 0,
                openTickets: parseInt(ticketStats.open_tickets) || 0
            };

            res.status(200).json(stats);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}