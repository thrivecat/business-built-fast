// Customer Dashboard JavaScript
class CustomerDashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'overview';
        this.orders = [];
        this.tickets = [];
        this.init();
    }

    async init() {
        // Initialize Clerk authentication (mock for now)
        await this.initAuth();
        this.setupEventListeners();
        this.setupNavigation();
        await this.loadDashboardData();
    }

    async initAuth() {
        try {
            // Check if user is signed in with Clerk
            const user = window.Clerk.user;
            if (!user) {
                // Redirect to sign-in if not authenticated
                window.location.href = '/?sign-in=true';
                return;
            }

            this.currentUser = {
                id: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.primaryEmailAddress?.emailAddress || '',
                role: 'customer'
            };

            this.updateUserDisplay();
        } catch (error) {
            console.error('Authentication error:', error);
            window.location.href = '/?sign-in=true';
        }
    }

    updateUserDisplay() {
        document.getElementById('userName').textContent = 
            `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        document.getElementById('userEmail').textContent = this.currentUser.email;
        document.getElementById('profileFirstName').value = this.currentUser.firstName;
        document.getElementById('profileLastName').value = this.currentUser.lastName;
        document.getElementById('profileEmail').value = this.currentUser.email;
    }

    setupEventListeners() {
        // Sign out button
        document.getElementById('signOutBtn').addEventListener('click', () => {
            this.signOut();
        });

        // Create ticket button
        document.getElementById('createTicketBtn').addEventListener('click', () => {
            this.openModal('ticketModal');
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
        });

        // Cancel ticket button
        document.getElementById('cancelTicketBtn').addEventListener('click', () => {
            this.closeModal('ticketModal');
        });

        // Ticket form submission
        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTicket();
        });

        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Order status filter
        document.getElementById('orderStatusFilter').addEventListener('change', (e) => {
            this.filterOrders(e.target.value);
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update active section
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'orders':
                this.loadOrders();
                break;
            case 'tickets':
                this.loadTickets();
                break;
            case 'onboarding':
                this.loadOnboardingForms();
                break;
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadRecentActivity(),
                this.loadOrders(),
                this.loadTickets()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`/api/dashboard-stats?userId=${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
                document.getElementById('totalSpent').textContent = `$${(stats.totalSpent || 0).toLocaleString()}`;
                document.getElementById('openTickets').textContent = stats.openTickets || 0;
                document.getElementById('completedOrders').textContent = stats.completedOrders || 0;
            } else {
                // Show zeros if no data
                document.getElementById('totalOrders').textContent = '0';
                document.getElementById('totalSpent').textContent = '$0';
                document.getElementById('openTickets').textContent = '0';
                document.getElementById('completedOrders').textContent = '0';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Show zeros on error
            document.getElementById('totalOrders').textContent = '0';
            document.getElementById('totalSpent').textContent = '$0';
            document.getElementById('openTickets').textContent = '0';
            document.getElementById('completedOrders').textContent = '0';
        }
    }

    async loadRecentActivity() {
        try {
            const response = await fetch(`/api/recent-activity?userId=${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            const activityList = document.getElementById('recentActivity');
            
            if (response.ok) {
                const activities = await response.json();
                if (activities.length === 0) {
                    activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
                    return;
                }
                
                activityList.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">${activity.icon}</div>
                        <div class="activity-content">
                            <p>${activity.message}</p>
                            <span class="activity-time">${activity.time}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            document.getElementById('recentActivity').innerHTML = '<div class="error">Error loading activity</div>';
        }
    }

    async loadOrders() {
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '<div class="loading">Loading orders...</div>';

        try {
            const response = await fetch(`/api/orders?userId=${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.orders = await response.json();
                this.renderOrders(this.orders);
            } else {
                this.orders = [];
                this.renderOrders([]);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.orders = [];
            ordersList.innerHTML = '<div class="error">Error loading orders</div>';
        }
    }

    renderOrders(orders) {
        const ordersList = document.getElementById('ordersList');
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<div class="empty-state">No orders found</div>';
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <div class="order-card" onclick="dashboard.showOrderDetails(${order.id})">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.id}</h3>
                        <p>${new Date(order.date).toLocaleDateString()} • ${order.items} item${order.items !== 1 ? 's' : ''}</p>
                    </div>
                    <div class="order-status status-${order.status}">${order.status}</div>
                </div>
                <div class="order-total">
                    <strong>$${order.total.toFixed(2)}</strong>
                </div>
            </div>
        `).join('');
    }

    filterOrders(status) {
        const filtered = status ? 
            this.orders.filter(order => order.status === status) : 
            this.orders;
        this.renderOrders(filtered);
    }

    async loadTickets() {
        const ticketsList = document.getElementById('ticketsList');
        ticketsList.innerHTML = '<div class="loading">Loading tickets...</div>';

        try {
            const response = await fetch(`/api/tickets?userId=${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.tickets = await response.json();
                this.renderTickets(this.tickets);
            } else {
                this.tickets = [];
                this.renderTickets([]);
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
            this.tickets = [];
            ticketsList.innerHTML = '<div class="error">Error loading tickets</div>';
        }
    }

    renderTickets(tickets) {
        const ticketsList = document.getElementById('ticketsList');
        
        if (tickets.length === 0) {
            ticketsList.innerHTML = '<div class="empty-state">No tickets found</div>';
            return;
        }

        ticketsList.innerHTML = tickets.map(ticket => `
            <div class="ticket-card" onclick="dashboard.showTicketDetails(${ticket.id})">
                <div class="ticket-header">
                    <div class="ticket-info">
                        <h3>${ticket.subject}</h3>
                        <p>Ticket #${ticket.id} • ${new Date(ticket.created_at).toLocaleDateString()} • ${ticket.comment_count} comment${ticket.comment_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div class="ticket-badges">
                        <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
                        <span class="ticket-priority priority-${ticket.priority}">${ticket.priority}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadOnboardingForms() {
        const onboardingList = document.getElementById('onboardingList');
        onboardingList.innerHTML = '<div class="loading">Loading forms...</div>';

        try {
            const response = await fetch(`/api/onboarding-forms?userId=${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const forms = await response.json();
                if (forms.length === 0) {
                    onboardingList.innerHTML = '<div class="empty-state">No onboarding forms found</div>';
                    return;
                }
                
                onboardingList.innerHTML = forms.map(form => `
                    <div class="onboarding-card">
                        <div class="form-info">
                            <h3>${form.title}</h3>
                            <p>Order #${form.order_id} • ${form.submitted_at ? new Date(form.submitted_at).toLocaleDateString() : 'Not submitted'}</p>
                        </div>
                        <div class="form-status status-${form.status}">${form.status}</div>
                    </div>
                `).join('');
            } else {
                onboardingList.innerHTML = '<div class="empty-state">No onboarding forms found</div>';
            }
        } catch (error) {
            console.error('Error loading onboarding forms:', error);
            onboardingList.innerHTML = '<div class="error">Error loading forms</div>';
        }
    }

    async createTicket() {
        const subject = document.getElementById('ticketSubject').value;
        const priority = document.getElementById('ticketPriority').value;
        const description = document.getElementById('ticketDescription').value;

        try {
            // Mock API call - replace with actual implementation
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    user_id: this.currentUser.id,
                    subject,
                    description,
                    priority,
                    customer_email: this.currentUser.email,
                    customer_name: `${this.currentUser.firstName} ${this.currentUser.lastName}`
                })
            });

            if (response.ok) {
                this.showNotification('Ticket created successfully!', 'success');
                this.closeModal('ticketModal');
                document.getElementById('ticketForm').reset();
                await this.loadTickets();
            } else {
                throw new Error('Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            this.showNotification('Error creating ticket. Please try again.', 'error');
        }
    }

    async updateProfile() {
        const firstName = document.getElementById('profileFirstName').value;
        const lastName = document.getElementById('profileLastName').value;

        try {
            // Mock API call - replace with actual implementation
            this.currentUser.firstName = firstName;
            this.currentUser.lastName = lastName;
            this.updateUserDisplay();
            this.showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Error updating profile. Please try again.', 'error');
        }
    }

    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const orderDetails = document.getElementById('orderDetails');
        orderDetails.innerHTML = `
            <div class="order-details-content">
                <div class="detail-row">
                    <span class="label">Order ID:</span>
                    <span class="value">#${order.id}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">${new Date(order.date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">
                        <span class="order-status status-${order.status}">${order.status}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Total:</span>
                    <span class="value"><strong>$${order.total.toFixed(2)}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="label">Items:</span>
                    <span class="value">${order.items} item${order.items !== 1 ? 's' : ''}</span>
                </div>
            </div>
        `;

        this.openModal('orderModal');
    }

    showTicketDetails(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const ticketDetails = document.getElementById('ticketDetails');
        ticketDetails.innerHTML = `
            <div class="ticket-details-content">
                <div class="detail-row">
                    <span class="label">Ticket ID:</span>
                    <span class="value">#${ticket.id}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Subject:</span>
                    <span class="value">${ticket.subject}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">
                        <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Priority:</span>
                    <span class="value">
                        <span class="ticket-priority priority-${ticket.priority}">${ticket.priority}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Created:</span>
                    <span class="value">${new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Comments:</span>
                    <span class="value">${ticket.comment_count}</span>
                </div>
            </div>
        `;

        this.openModal('ticketDetailsModal');
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    }

    async getAuthToken() {
        try {
            return await window.Clerk.session?.getToken();
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
            ${type === 'success' ? 'background: #28a745;' : ''}
            ${type === 'error' ? 'background: #dc3545;' : ''}
            ${type === 'info' ? 'background: #17a2b8;' : ''}
        `;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            try {
                await window.Clerk.signOut();
                window.location.href = '/';
            } catch (error) {
                console.error('Error signing out:', error);
                window.location.href = '/';
            }
        }
    }
}

// Initialize dashboard when Clerk is loaded
window.addEventListener('load', () => {
    if (window.Clerk) {
        window.dashboard = new CustomerDashboard();
    } else {
        // Wait for Clerk to load
        const checkClerk = setInterval(() => {
            if (window.Clerk) {
                clearInterval(checkClerk);
                window.dashboard = new CustomerDashboard();
            }
        }, 100);
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .detail-row:last-child {
        border-bottom: none;
    }
    
    .detail-row .label {
        font-weight: 500;
        color: #666;
    }
    
    .detail-row .value {
        color: #1a1a1a;
    }
    
    .order-details-content,
    .ticket-details-content {
        padding: 2rem;
    }
    
    .ticket-badges {
        display: flex;
        gap: 0.5rem;
        flex-direction: column;
        align-items: flex-end;
    }
    
    .empty-state, .error {
        text-align: center;
        padding: 3rem;
        color: #666;
        font-style: italic;
    }
    
    .error {
        color: #dc3545;
    }
`;
document.head.appendChild(style);