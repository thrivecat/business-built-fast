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
        // TODO: Add admin authorization check here
        // const authHeader = req.headers.authorization;
        // Verify user is admin (deanhassan20@gmail.com)

        const client = await pool.connect();
        
        try {
            // Get admin dashboard stats
            const revenueQuery = `
                SELECT SUM(total_amount) as total_revenue
                FROM orders 
                WHERE status IN ('processing', 'shipped', 'delivered')
            `;
            
            const ordersQuery = `
                SELECT COUNT(*) as total_orders
                FROM orders
            `;
            
            const customersQuery = `
                SELECT COUNT(DISTINCT user_id) as total_customers
                FROM orders
                WHERE user_id IS NOT NULL
            `;
            
            const ticketsQuery = `
                SELECT COUNT(*) as open_tickets
                FROM tickets 
                WHERE status = 'open'
            `;

            const [revenueResult, ordersResult, customersResult, ticketsResult] = await Promise.all([
                client.query(revenueQuery),
                client.query(ordersQuery),
                client.query(customersQuery),
                client.query(ticketsQuery)
            ]);

            const stats = {
                totalRevenue: parseFloat(revenueResult.rows[0].total_revenue) || 0,
                totalOrders: parseInt(ordersResult.rows[0].total_orders) || 0,
                totalCustomers: parseInt(customersResult.rows[0].total_customers) || 0,
                openTickets: parseInt(ticketsResult.rows[0].open_tickets) || 0
            };

            res.status(200).json(stats);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}