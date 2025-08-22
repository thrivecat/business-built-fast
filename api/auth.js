// Clerk authentication handler for Vercel
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { method, headers } = req;
        const authHeader = headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7);

        // Verify token with Clerk (you'll need to implement this with Clerk's backend SDK)
        // For now, we'll do basic validation
        if (method === 'GET') {
            // Get user information
            return res.status(200).json({
                user: {
                    id: 'user_123',
                    email: 'user@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'customer' // or 'admin'
                }
            });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}