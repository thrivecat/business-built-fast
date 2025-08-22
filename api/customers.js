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
            // Get customer data with aggregated stats
            const query = `
                SELECT 
                    user_id,
                    customer_name as name,
                    customer_email as email,
                    MIN(created_at) as join_date,
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_spent
                FROM orders 
                WHERE user_id IS NOT NULL
                GROUP BY user_id, customer_name, customer_email
                ORDER BY total_spent DESC, join_date DESC
            `;

            const result = await client.query(query);
            
            const customers = result.rows.map(row => ({
                id: row.user_id,
                name: row.name || 'Unknown',
                email: row.email || 'No email',
                join_date: row.join_date,
                total_orders: parseInt(row.total_orders) || 0,
                total_spent: parseFloat(row.total_spent) || 0
            }));

            res.status(200).json(customers);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}