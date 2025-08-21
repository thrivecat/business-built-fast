// Shopping Cart System for Business Built Fast
class ShoppingCart {
    constructor() {
        this.items = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createCartSlider();
        this.bindEvents();
        this.loadFromStorage();
    }

    createCartSlider() {
        const cartHTML = `
            <div id="cart-overlay" class="cart-overlay">
                <div class="cart-slider">
                    <div class="cart-header">
                        <h3>Your Cart</h3>
                        <button class="cart-close" onclick="cart.closeCart()">&times;</button>
                    </div>
                    
                    <div class="cart-items" id="cart-items">
                        <div class="empty-cart">
                            <p>Your cart is empty</p>
                            <p class="empty-subtitle">Add some ready-made businesses to get started!</p>
                        </div>
                    </div>
                    
                    <div class="cart-upsells" id="cart-upsells">
                        <!-- Upsells will be inserted here -->
                    </div>
                    
                    <div class="cart-footer">
                        <div class="cart-total">
                            <div class="total-row subtotal">
                                <span>Subtotal:</span>
                                <span id="cart-subtotal">$0</span>
                            </div>
                            <div class="total-row discount" id="discount-row" style="display: none;">
                                <span>Discount:</span>
                                <span id="cart-discount">-$0</span>
                            </div>
                            <div class="total-row final-total">
                                <span>Total:</span>
                                <span id="cart-total">$0</span>
                            </div>
                        </div>
                        
                        <button class="checkout-btn" onclick="cart.proceedToCheckout()" disabled>
                            Proceed to Checkout
                        </button>
                        
                        <div class="security-badges">
                            <span>🔒 Secure SSL Encryption</span>
                            <span>💳 Stripe Payments</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }

    bindEvents() {
        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-to-cart-btn, .add-to-cart-btn *')) {
                const btn = e.target.closest('.add-to-cart-btn');
                this.addToCart(btn);
            }
        });

        // Close cart when clicking overlay
        document.getElementById('cart-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'cart-overlay') {
                this.closeCart();
            }
        });
    }

    addToCart(button) {
        const productData = {
            id: button.dataset.productId || `product-${Date.now()}`,
            name: button.dataset.productName || 'Business Package',
            price: parseFloat(button.dataset.price) || 497,
            originalPrice: parseFloat(button.dataset.originalPrice) || null,
            image: button.dataset.image || null,
            description: button.dataset.description || '',
            type: button.dataset.type || 'main'
        };

        // Check if item already exists
        const existingItem = this.items.find(item => item.id === productData.id);
        if (existingItem) {
            this.showNotification('Item already in cart!', 'info');
            this.openCart();
            return;
        }

        this.items.push({...productData, quantity: 1});
        this.saveToStorage();
        this.updateCartDisplay();
        this.showUpsells(productData);
        this.showNotification(`${productData.name} added to cart!`, 'success');
        this.openCart();
    }

    removeFromCart(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveToStorage();
            this.updateCartDisplay();
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const checkoutBtn = document.querySelector('.checkout-btn');
        
        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <p class="empty-subtitle">Add some ready-made businesses to get started!</p>
                </div>
            `;
            checkoutBtn.disabled = true;
        } else {
            cartItems.innerHTML = this.items.map(item => this.renderCartItem(item)).join('');
            checkoutBtn.disabled = false;
        }
        
        this.updateTotals();
    }

    renderCartItem(item) {
        return `
            <div class="cart-item" data-id="${item.id}">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">` : ''}
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    ${item.description ? `<p class="cart-item-desc">${item.description}</p>` : ''}
                    <div class="cart-item-price">
                        ${item.originalPrice ? `<span class="original-price">$${item.originalPrice}</span>` : ''}
                        <span class="current-price">$${item.price}</span>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-item" onclick="cart.removeFromCart('${item.id}')">🗑️</button>
                </div>
            </div>
        `;
    }

    showUpsells(mainProduct) {
        const upsellsContainer = document.getElementById('cart-upsells');
        
        // Define upsells based on main product
        const upsells = this.getUpsellsForProduct(mainProduct);
        
        if (upsells.length > 0) {
            upsellsContainer.innerHTML = `
                <div class="upsells-header">
                    <h4>🚀 Boost Your Success!</h4>
                    <p>Add these to maximize your results</p>
                </div>
                <div class="upsells-grid">
                    ${upsells.map(upsell => this.renderUpsell(upsell)).join('')}
                </div>
            `;
        }
    }

    getUpsellsForProduct(mainProduct) {
        const allUpsells = [
            {
                id: 'premium-support',
                name: '90-Day Premium Support',
                price: 197,
                originalPrice: 397,
                description: 'Personal 1-on-1 coaching calls',
                benefit: 'Get results 3x faster'
            },
            {
                id: 'automation-package',
                name: 'Full Automation Package',
                price: 297,
                originalPrice: 597,
                description: 'Complete hands-off business setup',
                benefit: 'Save 20+ hours of setup time'
            },
            {
                id: 'marketing-templates',
                name: 'Marketing Templates Bundle',
                price: 97,
                originalPrice: 197,
                description: '50+ proven marketing templates',
                benefit: 'Increase conversions by 45%'
            }
        ];

        // Filter out upsells already in cart
        const cartIds = this.items.map(item => item.id);
        return allUpsells.filter(upsell => !cartIds.includes(upsell.id));
    }

    renderUpsell(upsell) {
        return `
            <div class="upsell-item">
                <div class="upsell-content">
                    <h5>${upsell.name}</h5>
                    <p class="upsell-desc">${upsell.description}</p>
                    <p class="upsell-benefit">✅ ${upsell.benefit}</p>
                    <div class="upsell-pricing">
                        <span class="upsell-original">$${upsell.originalPrice}</span>
                        <span class="upsell-price">$${upsell.price}</span>
                        <span class="upsell-savings">Save $${upsell.originalPrice - upsell.price}</span>
                    </div>
                </div>
                <button class="add-upsell-btn" onclick="cart.addUpsell('${upsell.id}')">
                    Add to Cart
                </button>
            </div>
        `;
    }

    addUpsell(upsellId) {
        const upsells = this.getUpsellsForProduct({});
        const upsell = [...upsells, ...this.getUpsellsForProduct({})].find(u => u.id === upsellId);
        
        if (upsell) {
            this.items.push({
                ...upsell,
                quantity: 1,
                type: 'upsell'
            });
            this.saveToStorage();
            this.updateCartDisplay();
            this.showNotification(`${upsell.name} added!`, 'success');
        }
    }

    updateTotals() {
        const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const discount = this.calculateDiscount(subtotal);
        const total = subtotal - discount;
        
        document.getElementById('cart-subtotal').textContent = `$${subtotal}`;
        document.getElementById('cart-total').textContent = `$${total}`;
        
        if (discount > 0) {
            document.getElementById('cart-discount').textContent = `-$${discount}`;
            document.getElementById('discount-row').style.display = 'flex';
        } else {
            document.getElementById('discount-row').style.display = 'none';
        }
    }

    calculateDiscount(subtotal) {
        let discount = 0;
        
        // Volume discount
        if (subtotal > 1000) discount += subtotal * 0.1; // 10% off orders over $1000
        else if (subtotal > 500) discount += subtotal * 0.05; // 5% off orders over $500
        
        // Bundle discount
        if (this.items.length >= 3) discount += 50; // $50 off for 3+ items
        
        return Math.round(discount);
    }

    openCart() {
        this.isOpen = true;
        document.getElementById('cart-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        this.isOpen = false;
        document.getElementById('cart-overlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    proceedToCheckout() {
        if (this.items.length === 0) return;
        
        // Store cart data for checkout
        this.saveToStorage();
        
        // Redirect to checkout page
        window.location.href = '/checkout';
    }

    saveToStorage() {
        localStorage.setItem('cart_items', JSON.stringify(this.items));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('cart_items');
        if (saved) {
            this.items = JSON.parse(saved);
            this.updateCartDisplay();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Public methods for external access
    getCartCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getCartTotal() {
        const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        return subtotal - this.calculateDiscount(subtotal);
    }

    clearCart() {
        this.items = [];
        this.saveToStorage();
        this.updateCartDisplay();
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});