const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    const { method } = req;
    
    try {
        const client = await pool.connect();
        
        try {
            switch (method) {
                case 'GET':
                    const { userId } = req.query;
                    
                    if (!userId) {
                        return res.status(400).json({ error: 'User ID is required' });
                    }

                    const query = `
                        SELECT 
                            of.*,
                            o.id as order_id
                        FROM onboarding_forms of
                        LEFT JOIN orders o ON of.order_id = o.id
                        WHERE of.user_id = $1
                        ORDER BY of.created_at DESC
                    `;
                    
                    const result = await client.query(query, [userId]);
                    
                    const forms = result.rows.map(form => ({
                        id: form.id,
                        order_id: form.order_id,
                        title: form.form_type || 'Onboarding Form',
                        status: form.status || 'pending',
                        submitted_at: form.submitted_at,
                        data: form.form_data
                    }));

                    res.status(200).json(forms);
                    break;

                case 'POST':
                    const { user_id, order_id, form_type, form_data } = req.body;
                    
                    if (!user_id || !form_data) {
                        return res.status(400).json({ error: 'User ID and form data are required' });
                    }

                    const insertQuery = `
                        INSERT INTO onboarding_forms (user_id, order_id, form_type, form_data, status, submitted_at)
                        VALUES ($1, $2, $3, $4, 'submitted', NOW())
                        RETURNING *
                    `;
                    
                    const insertResult = await client.query(insertQuery, [
                        user_id, 
                        order_id, 
                        form_type || 'General Onboarding',
                        JSON.stringify(form_data)
                    ]);

                    res.status(201).json(insertResult.rows[0]);
                    break;

                default:
                    res.status(405).json({ message: 'Method not allowed' });
                    break;
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error handling onboarding forms:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}