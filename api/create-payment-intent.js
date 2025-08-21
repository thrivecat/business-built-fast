// Vercel serverless function for creating Stripe payment intents
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

    try {
        console.log('Payment intent request received:', {
            method: req.method,
            body: req.body
        });

        const { amount, currency = 'usd', customer_info, cart_items } = req.body;

        // Validate required fields
        if (!amount || !customer_info || !cart_items) {
            console.error('Missing required fields:', { amount: !!amount, customer_info: !!customer_info, cart_items: !!cart_items });
            return res.status(400).json({
                error: 'Missing required fields: amount, customer_info, cart_items'
            });
        }

        // Validate amount is a positive number
        if (isNaN(amount) || amount <= 0) {
            console.error('Invalid amount:', amount);
            return res.status(400).json({
                error: 'Amount must be a positive number'
            });
        }

        // Create or retrieve customer
        let customer;
        try {
            const existingCustomers = await stripe.customers.list({
                email: customer_info.email,
                limit: 1
            });

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
            } else {
                customer = await stripe.customers.create({
                    email: customer_info.email,
                    name: `${customer_info.firstName} ${customer_info.lastName}`,
                    phone: customer_info.phone,
                    address: {
                        line1: customer_info.address,
                        city: customer_info.city,
                        state: customer_info.state,
                        postal_code: customer_info.zip,
                        country: customer_info.country || 'US',
                    },
                    metadata: {
                        source: 'BusinessBuiltFast',
                        signup_date: new Date().toISOString(),
                    }
                });
            }
        } catch (customerError) {
            console.error('Customer creation error:', customerError);
            // Continue without customer if there's an issue
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in cents
            currency: currency,
            customer: customer?.id,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                customer_name: `${customer_info.firstName} ${customer_info.lastName}`,
                customer_email: customer_info.email,
                items: JSON.stringify(cart_items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))),
                order_date: new Date().toISOString(),
                source: 'BusinessBuiltFast'
            },
            description: `Business Built Fast - ${cart_items.length} item${cart_items.length !== 1 ? 's' : ''}`,
            receipt_email: customer_info.email,
        });

        res.status(200).json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            customer_id: customer?.id
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);
        
        res.status(500).json({
            error: 'Failed to create payment intent',
            message: error.message
        });
    }
}