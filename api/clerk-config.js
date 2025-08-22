export default function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Return Clerk configuration
        const config = {
            publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        };

        if (!config.publishableKey) {
            return res.status(500).json({ 
                error: 'Clerk publishable key not configured' 
            });
        }

        res.status(200).json(config);
    } catch (error) {
        console.error('Error getting Clerk config:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
}