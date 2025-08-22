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
            // Get recent admin activities
            const query = `
                SELECT 
                    'order' as type,
                    id,
                    'New order #' || id || ' received from ' || customer_name as message,
                    '📦' as icon,
                    created_at
                FROM orders 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                
                UNION ALL
                
                SELECT 
                    'ticket' as type,
                    id,
                    'Support ticket #' || id || ' - ' || subject as message,
                    '🎫' as icon,
                    created_at
                FROM tickets 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                
                UNION ALL
                
                SELECT 
                    'customer' as type,
                    NULL as id,
                    'New customer registration: ' || customer_email as message,
                    '👥' as icon,
                    created_at
                FROM orders 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                
                ORDER BY created_at DESC 
                LIMIT 10
            `;

            const result = await client.query(query);
            
            const activities = result.rows.map(row => ({
                icon: row.icon,
                message: row.message,
                time: getTimeAgo(new Date(row.created_at))
            }));

            res.status(200).json(activities);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error loading admin activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}