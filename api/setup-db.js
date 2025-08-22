// Database setup script - run once to create tables
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const client = await pool.connect();
        
        // Create tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                clerk_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                role VARCHAR(20) DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                customer_email VARCHAR(255) NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                stripe_payment_intent_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id VARCHAR(255),
                product_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'open',
                priority VARCHAR(20) DEFAULT 'medium',
                customer_email VARCHAR(255) NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
                comment TEXT NOT NULL,
                author_type VARCHAR(20) DEFAULT 'customer',
                author_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS onboarding_forms (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                order_id INTEGER REFERENCES orders(id),
                form_data JSONB NOT NULL,
                status VARCHAR(50) DEFAULT 'submitted',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Create indexes for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);');

        client.release();

        res.status(200).json({ 
            success: true, 
            message: 'Database tables created successfully' 
        });

    } catch (error) {
        console.error('Database setup error:', error);
        res.status(500).json({ 
            error: 'Failed to setup database', 
            details: error.message 
        });
    }
}