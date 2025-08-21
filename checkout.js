// Checkout System for Business Built Fast
// NOTE: Replace 'YOUR_STRIPE_PUBLISHABLE_KEY' with your actual Stripe key

// Initialize Stripe with your publishable key
const stripe = Stripe('pk_test_51Ruu8EJwK5jURCgm16rwyT6ZQ3xoI5hyPAKXLTNRHt6JjMFTZSaQkFlb8zMdNdt0o4fwC7rC0ERGwdtaYRKT3Ef800ooX2GyMi');
const elements = stripe.elements();

class CheckoutSystem {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart_items') || '[]');
        this.total = 0;
        this.cardElement = null;
        this.init();
    }

    init() {
        this.displayOrderSummary();
        this.setupStripeElements();
        this.bindEvents();
        this.calculateTotals();
    }

    displayOrderSummary() {
        const orderItems = document.getElementById('order-items');
        
        if (this.cart.length === 0) {
            orderItems.innerHTML = `
                <div class="empty-order">
                    <p>No items in your order</p>
                    <a href="index.html" class="primary-button">Browse Businesses</a>
                </div>
            `;
            return;
        }

        orderItems.innerHTML = this.cart.map(item => `
            <div class="order-item">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="order-item-image">` : '<div class="order-item-image"></div>'}
                <div class="order-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <div class="item-quantity">Quantity: ${item.quantity}</div>
                </div>
                <div class="order-item-price">
                    ${item.originalPrice ? `<div class="item-original-price">$${item.originalPrice}</div>` : ''}
                    <div class="item-price">$${item.price}</div>
                </div>
            </div>
        `).join('');
    }

    calculateTotals() {
        const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const discount = this.calculateDiscount(subtotal);
        const tax = this.calculateTax(subtotal - discount);
        this.total = subtotal - discount + tax;

        document.getElementById('checkout-subtotal').textContent = `$${subtotal}`;
        document.getElementById('checkout-total').textContent = `$${this.total}`;
        document.getElementById('button-total').textContent = `$${this.total}`;

        if (discount > 0) {
            document.getElementById('checkout-discount').textContent = `-$${discount}`;
            document.getElementById('checkout-discount-row').style.display = 'flex';
        }

        if (tax > 0) {
            document.getElementById('checkout-tax').textContent = `$${tax}`;
        }
    }

    calculateDiscount(subtotal) {
        let discount = 0;
        
        // Volume discounts
        if (subtotal > 1000) discount += subtotal * 0.1;
        else if (subtotal > 500) discount += subtotal * 0.05;
        
        // Bundle discount
        if (this.cart.length >= 2) discount += 50;
        
        return Math.round(discount);
    }

    calculateTax(amount) {
        // Simple tax calculation - you may want to integrate with a tax service
        const taxRate = 0.0; // Set to 0 for now, update based on customer location
        return Math.round(amount * taxRate);
    }

    setupStripeElements() {
        // Create card element
        this.cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#9e2146',
                },
            },
        });

        this.cardElement.mount('#card-element');

        // Handle real-time validation errors from the card Element
        this.cardElement.addEventListener('change', ({error}) => {
            const displayError = document.getElementById('card-errors');
            if (error) {
                displayError.textContent = error.message;
                displayError.classList.add('visible');
            } else {
                displayError.textContent = '';
                displayError.classList.remove('visible');
            }
        });
    }

    bindEvents() {
        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
                method.classList.add('active');
                
                const methodType = method.dataset.method;
                this.switchPaymentMethod(methodType);
            });
        });

        // Form submission
        document.getElementById('payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Country selection for tax calculation
        document.getElementById('country').addEventListener('change', () => {
            this.calculateTotals();
        });
    }

    switchPaymentMethod(method) {
        const cardPayment = document.getElementById('card-payment');
        const paypalPayment = document.getElementById('paypal-payment');

        if (method === 'card') {
            cardPayment.style.display = 'block';
            paypalPayment.style.display = 'none';
        } else if (method === 'paypal') {
            cardPayment.style.display = 'none';
            paypalPayment.style.display = 'block';
            this.setupPayPal();
        }
    }

    async handleSubmit() {
        const submitButton = document.getElementById('submit-payment');
        const buttonText = document.getElementById('button-text');
        const spinner = document.getElementById('payment-spinner');

        // Disable submit button and show spinner
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        spinner.style.display = 'block';

        try {
            // Get form data
            const formData = this.getFormData();
            
            // Validate form
            if (!this.validateForm(formData)) {
                throw new Error('Please fill in all required fields');
            }

            // Create payment intent on your server
            const paymentIntent = await this.createPaymentIntent({
                amount: Math.round(this.total * 100), // Convert to cents
                currency: 'usd',
                customer_info: formData,
                cart_items: this.cart
            });

            // Confirm payment with Stripe
            const {error, paymentIntent: confirmedPayment} = await stripe.confirmCardPayment(
                paymentIntent.client_secret,
                {
                    payment_method: {
                        card: this.cardElement,
                        billing_details: {
                            name: `${formData.firstName} ${formData.lastName}`,
                            email: formData.email,
                            phone: formData.phone,
                            address: {
                                line1: formData.address,
                                city: formData.city,
                                state: formData.state,
                                postal_code: formData.zip,
                                country: formData.country,
                            }
                        }
                    }
                }
            );

            if (error) {
                throw new Error(error.message);
            }

            if (confirmedPayment.status === 'succeeded') {
                // Payment successful
                this.handlePaymentSuccess(confirmedPayment);
            }

        } catch (error) {
            this.showError(error.message);
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            buttonText.style.display = 'block';
            spinner.style.display = 'none';
        }
    }

    async createPaymentIntent(data) {
        console.log('Creating payment intent with data:', data);
        
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            console.log('Payment intent response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('Payment intent error response:', errorData);
                throw new Error(`Failed to create payment intent: ${response.status} ${errorData}`);
            }

            const result = await response.json();
            console.log('Payment intent created successfully:', result);
            return result;
        } catch (error) {
            console.error('Payment intent creation error:', error);
            throw error;
        }
    }

    getFormData() {
        return {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zip: document.getElementById('zip').value,
            country: document.getElementById('country').value,
            terms: document.getElementById('terms').checked,
            refundPolicy: document.getElementById('refund-policy').checked,
            marketing: document.getElementById('marketing').checked,
        };
    }

    validateForm(data) {
        const required = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zip', 'country'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                this.showError(`Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }

        if (!data.terms || !data.refundPolicy) {
            this.showError('Please accept the terms and conditions');
            return false;
        }

        return true;
    }

    handlePaymentSuccess(paymentIntent) {
        // Clear cart
        localStorage.removeItem('cart_items');
        
        // Store order details for thank you page
        localStorage.setItem('order_details', JSON.stringify({
            id: paymentIntent.id,
            amount: this.total,
            items: this.cart,
            timestamp: new Date().toISOString()
        }));
        
        // Redirect to success page
        window.location.href = '/success';
    }

    setupPayPal() {
        // PayPal integration would go here
        // For now, show placeholder
        document.getElementById('paypal-button-container').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                PayPal integration coming soon!<br>
                Please use credit/debit card for now.
            </div>
        `;
    }

    showError(message) {
        // Create or update error notification
        let errorDiv = document.querySelector('.checkout-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'checkout-error';
            errorDiv.style.cssText = `
                position: fixed;
                top: 100px;
                right: 2rem;
                background: #dc2626;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 300px;
            `;
            document.body.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('payment-form')) {
        new CheckoutSystem();
    }
});