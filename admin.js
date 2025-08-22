// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'overview';
        this.orders = [];
        this.tickets = [];
        this.customers = [];
        this.init();
    }

    async init() {
        await this.initAuth();
        this.setupEventListeners();
        this.setupNavigation();
        await this.loadDashboardData();
    }

    async initAuth() {
        try {
            // Wait for Clerk to be fully loaded
            if (!window.Clerk?.loaded) {
                setTimeout(() => this.initAuth(), 100);
                return;
            }

            // Check if user is signed in with Clerk
            const user = window.Clerk.user;
            if (!user) {
                // Redirect to sign-in if not authenticated
                await window.Clerk.redirectToSignIn();
                return;
            }

            // Check if user is admin (deanhassan20@gmail.com)
            const email = user.primaryEmailAddress?.emailAddress;
            if (email !== 'deanhassan20@gmail.com') {
                // Redirect non-admin users to customer dashboard
                window.location.href = '/dashboard';
                return;
            }

            this.currentUser = {
                id: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: email,
                role: 'admin'
            };

            this.updateUserDisplay();
        } catch (error) {
            console.error('Authentication error:', error);
            if (window.Clerk?.loaded) {
                await window.Clerk.redirectToSignIn();
            } else {
                window.location.href = '/';
            }
        }
    }

    updateUserDisplay() {
        document.getElementById('userName').textContent = 
            `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        document.getElementById('userEmail').textContent = this.currentUser.email;
    }

    setupEventListeners() {
        // Sign out button
        document.getElementById('signOutBtn').addEventListener('click', () => {
            this.signOut();
        });

        // Order status filter
        document.getElementById('adminOrderStatusFilter').addEventListener('change', (e) => {
            this.filterOrders(e.target.value);
        });

        // Ticket filters
        document.getElementById('adminTicketStatusFilter').addEventListener('change', () => {
            this.filterTickets();
        });

        document.getElementById('adminTicketPriorityFilter').addEventListener('change', () => {
            this.filterTickets();
        });

        // Settings forms
        document.getElementById('emailSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEmailSettings();
        });

        // Database actions
        document.getElementById('initDbBtn').addEventListener('click', () => {
            this.initializeDatabase();
        });

        document.getElementById('backupDbBtn').addEventListener('click', () => {
            this.backupDatabase();
        });

        document.getElementById('clearLogsBtn').addEventListener('click', () => {
            this.clearLogs();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
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
            case 'customers':
                this.loadCustomers();
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
                this.loadTickets(),
                this.loadCustomers()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin-stats', {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                document.getElementById('totalRevenue').textContent = `$${(stats.totalRevenue || 0).toLocaleString()}`;
                document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
                document.getElementById('totalCustomers').textContent = stats.totalCustomers || 0;
                document.getElementById('openTickets').textContent = stats.openTickets || 0;
            } else {
                // Show zeros if no data
                document.getElementById('totalRevenue').textContent = '$0';
                document.getElementById('totalOrders').textContent = '0';
                document.getElementById('totalCustomers').textContent = '0';
                document.getElementById('openTickets').textContent = '0';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Show zeros on error
            document.getElementById('totalRevenue').textContent = '$0';
            document.getElementById('totalOrders').textContent = '0';
            document.getElementById('totalCustomers').textContent = '0';
            document.getElementById('openTickets').textContent = '0';
        }
    }

    async loadRecentActivity() {
        try {
            const response = await fetch('/api/admin-activity', {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            const activityList = document.getElementById('adminRecentActivity');
            
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
            document.getElementById('adminRecentActivity').innerHTML = '<div class="error">Error loading activity</div>';
        }
    }

    async loadOrders() {
        const ordersTable = document.getElementById('adminOrdersTable');
        ordersTable.innerHTML = '<tr><td colspan="6" class="loading">Loading orders...</td></tr>';

        try {
            const response = await fetch('/api/orders', {
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
            ordersTable.innerHTML = '<tr><td colspan="6" class="error">Error loading orders</td></tr>';
        }
    }

    renderOrders(orders) {
        const ordersTable = document.getElementById('adminOrdersTable');
        
        if (orders.length === 0) {
            ordersTable.innerHTML = '<tr><td colspan="6" class="empty-state">No orders found</td></tr>';
            return;
        }

        ordersTable.innerHTML = orders.map(order => `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>
                    <div>${order.customer_name}</div>
                    <div style="font-size: 0.85rem; color: #666;">${order.customer_email}</div>
                </td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td><strong>$${order.total.toFixed(2)}</strong></td>
                <td><span class="order-status status-${order.status}">${order.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm" onclick="adminDashboard.showOrderDetails(${order.id})">
                            View
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="adminDashboard.updateOrderStatus(${order.id})">
                            Update
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterOrders(status) {
        const filtered = status ? 
            this.orders.filter(order => order.status === status) : 
            this.orders;
        this.renderOrders(filtered);
    }

    async loadCustomers() {
        const customersTable = document.getElementById('adminCustomersTable');
        customersTable.innerHTML = '<tr><td colspan="7" class="loading">Loading customers...</td></tr>';

        try {
            const response = await fetch('/api/customers', {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.customers = await response.json();
                this.renderCustomers(this.customers);
            } else {
                this.customers = [];
                this.renderCustomers([]);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            customersTable.innerHTML = '<tr><td colspan="7" class="error">Error loading customers</td></tr>';
        }
    }

    renderCustomers(customers) {
        const customersTable = document.getElementById('adminCustomersTable');
        
        if (customers.length === 0) {
            customersTable.innerHTML = '<tr><td colspan="7" class="empty-state">No customers found</td></tr>';
            return;
        }

        customersTable.innerHTML = customers.map(customer => `
            <tr>
                <td><strong>${customer.id}</strong></td>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${new Date(customer.join_date).toLocaleDateString()}</td>
                <td>${customer.total_orders}</td>
                <td><strong>$${customer.total_spent.toFixed(2)}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm" onclick="adminDashboard.viewCustomer('${customer.id}')">
                            View
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="adminDashboard.emailCustomer('${customer.email}')">
                            Email
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadTickets() {
        const ticketsList = document.getElementById('adminTicketsList');
        ticketsList.innerHTML = '<div class="loading">Loading tickets...</div>';

        try {
            const response = await fetch('/api/tickets', {
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
            ticketsList.innerHTML = '<div class="error">Error loading tickets</div>';
        }
    }

    renderTickets(tickets) {
        const ticketsList = document.getElementById('adminTicketsList');
        
        if (tickets.length === 0) {
            ticketsList.innerHTML = '<div class="empty-state">No tickets found</div>';
            return;
        }

        ticketsList.innerHTML = tickets.map(ticket => `
            <div class="admin-ticket-card">
                <div class="admin-ticket-header">
                    <div class="ticket-info">
                        <h3>${ticket.subject}</h3>
                        <div class="ticket-meta">
                            <span>Ticket #${ticket.id}</span>
                            <span>•</span>
                            <span>${ticket.customer_name}</span>
                            <span>•</span>
                            <span>${new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>${ticket.comment_count} comment${ticket.comment_count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div class="ticket-badges">
                        <span class="ticket-status status-${ticket.status}">${ticket.status.replace('_', ' ')}</span>
                        <span class="ticket-priority priority-${ticket.priority}">${ticket.priority}</span>
                    </div>
                </div>
                <div class="ticket-actions">
                    <button class="btn btn-info btn-sm" onclick="adminDashboard.manageTicket(${ticket.id})">
                        Manage
                    </button>
                    <button class="btn btn-success btn-sm" onclick="adminDashboard.updateTicketStatus(${ticket.id}, 'in_progress')">
                        Take Action
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="adminDashboard.updateTicketStatus(${ticket.id}, 'closed')">
                        Close
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterTickets() {
        const statusFilter = document.getElementById('adminTicketStatusFilter').value;
        const priorityFilter = document.getElementById('adminTicketPriorityFilter').value;
        
        let filtered = this.tickets;
        
        if (statusFilter) {
            filtered = filtered.filter(ticket => ticket.status === statusFilter);
        }
        
        if (priorityFilter) {
            filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
        }
        
        this.renderTickets(filtered);
    }

    async loadOnboardingForms() {
        const onboardingList = document.getElementById('adminOnboardingList');
        onboardingList.innerHTML = '<div class="loading">Loading forms...</div>';

        try {
            const response = await fetch('/api/onboarding-forms', {
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
                            <h3>${form.form_type}</h3>
                            <p>${form.customer_name} • Order #${form.order_id} • ${new Date(form.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <div class="form-actions">
                            <span class="form-status status-${form.status}">${form.status}</span>
                            <button class="btn btn-info btn-sm" onclick="adminDashboard.reviewForm(${form.id})">
                                Review
                            </button>
                        </div>
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

    // Modal and Action Methods
    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const orderDetails = document.getElementById('adminOrderDetails');
        orderDetails.innerHTML = `
            <div class="order-management-tabs">
                <button class="tab-button active" data-tab="details">Order Details</button>
                <button class="tab-button" data-tab="status">Status Management</button>
                <button class="tab-button" data-tab="communication">Communication</button>
            </div>
            
            <div class="tab-content active" id="details-tab">
                <div class="order-details-content">
                    <div class="detail-row">
                        <span class="label">Order ID:</span>
                        <span class="value">#${order.id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Customer:</span>
                        <span class="value">${order.customer_name} (${order.customer_email})</span>
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
            </div>
            
            <div class="tab-content" id="status-tab">
                <div class="order-status-update">
                    <label for="newOrderStatus">Update Order Status:</label>
                    <select id="newOrderStatus" class="status-select">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="btn btn-primary" onclick="adminDashboard.saveOrderStatus(${order.id})">
                        Update Status
                    </button>
                </div>
            </div>
            
            <div class="tab-content" id="communication-tab">
                <p>Email communication history and tools would go here.</p>
            </div>
        `;

        // Setup tab functionality
        this.setupTabs();
        this.openModal('orderDetailsModal');
    }

    setupTabs() {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update active tab content
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }

    manageTicket(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const ticketDetails = document.getElementById('adminTicketDetails');
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
                    <span class="label">Customer:</span>
                    <span class="value">${ticket.customer_name} (${ticket.customer_email})</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">
                        <select id="ticketStatusUpdate" class="status-select">
                            <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                            <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Priority:</span>
                    <span class="value">
                        <select id="ticketPriorityUpdate" class="status-select">
                            <option value="low" ${ticket.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${ticket.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${ticket.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="urgent" ${ticket.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                        </select>
                    </span>
                </div>
            </div>
            
            <div class="ticket-conversation">
                <h4>Conversation History</h4>
                <div class="comment-item customer">
                    <div class="comment-author">
                        ${ticket.customer_name}
                        <span class="comment-time">${new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                    <div class="comment-text">Initial ticket submission would appear here...</div>
                </div>
            </div>
            
            <div class="add-comment">
                <h4>Add Response</h4>
                <textarea id="adminResponse" placeholder="Type your response here..."></textarea>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminDashboard.closeModal('ticketManageModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="adminDashboard.saveTicketResponse(${ticket.id})">Send Response</button>
                    <button class="btn btn-success" onclick="adminDashboard.updateTicketFromModal(${ticket.id})">Update Ticket</button>
                </div>
            </div>
        `;

        this.openModal('ticketManageModal');
    }

    // Settings and Actions
    async saveEmailSettings() {
        try {
            const settings = {
                newOrderNotification: document.getElementById('newOrderNotification').checked,
                ticketNotification: document.getElementById('ticketNotification').checked,
                dailyReports: document.getElementById('dailyReports').checked
            };

            const response = await fetch('/api/admin-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showNotification('Email settings saved successfully!', 'success');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving email settings:', error);
            this.showNotification('Error saving settings. Please try again.', 'error');
        }
    }

    async initializeDatabase() {
        if (!confirm('Are you sure you want to initialize the database? This will create/reset all tables.')) {
            return;
        }

        try {
            const response = await fetch('/api/setup-db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.showNotification('Database initialized successfully!', 'success');
            } else {
                throw new Error('Failed to initialize database');
            }
        } catch (error) {
            console.error('Error initializing database:', error);
            this.showNotification('Error initializing database. Please try again.', 'error');
        }
    }

    async backupDatabase() {
        try {
            this.showNotification('Starting database backup...', 'info');
            
            const response = await fetch('/api/backup-db', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.showNotification('Database backup completed!', 'success');
            } else {
                throw new Error('Failed to backup database');
            }
        } catch (error) {
            console.error('Error backing up database:', error);
            this.showNotification('Error creating backup. Please try again.', 'error');
        }
    }

    async clearLogs() {
        if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
            return;
        }

        try {
            this.showNotification('Clearing logs...', 'info');
            
            const response = await fetch('/api/clear-logs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.showNotification('Logs cleared successfully!', 'success');
            } else {
                throw new Error('Failed to clear logs');
            }
        } catch (error) {
            console.error('Error clearing logs:', error);
            this.showNotification('Error clearing logs. Please try again.', 'error');
        }
    }

    // Utility Methods
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
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

    // Action Methods for UI interactions
    async updateOrderStatus(orderId) {
        this.showNotification('Order status update feature coming soon', 'info');
    }

    async viewCustomer(customerId) {
        this.showNotification('Customer details view coming soon', 'info');
    }

    async emailCustomer(customerEmail) {
        this.showNotification('Customer email feature coming soon', 'info');
    }

    async updateTicketStatus(ticketId, newStatus) {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                this.showNotification('Ticket status updated successfully', 'success');
                await this.loadTickets(); // Reload tickets to reflect changes
            } else {
                throw new Error('Failed to update ticket status');
            }
        } catch (error) {
            console.error('Error updating ticket status:', error);
            this.showNotification('Error updating ticket status', 'error');
        }
    }

    async reviewForm(formId) {
        this.showNotification('Form review feature coming soon', 'info');
    }

    async saveOrderStatus(orderId) {
        const newStatus = document.getElementById('newOrderStatus').value;
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                this.showNotification('Order status updated successfully', 'success');
                this.closeModal('orderDetailsModal');
                await this.loadOrders(); // Reload orders to reflect changes
            } else {
                throw new Error('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showNotification('Error updating order status', 'error');
        }
    }

    async saveTicketResponse(ticketId) {
        const response = document.getElementById('adminResponse').value;
        if (!response.trim()) {
            this.showNotification('Please enter a response', 'error');
            return;
        }

        try {
            const apiResponse = await fetch(`/api/tickets/${ticketId}/responses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({ message: response })
            });

            if (apiResponse.ok) {
                this.showNotification('Response sent successfully', 'success');
                document.getElementById('adminResponse').value = '';
                await this.loadTickets(); // Reload tickets to reflect changes
            } else {
                throw new Error('Failed to send response');
            }
        } catch (error) {
            console.error('Error sending response:', error);
            this.showNotification('Error sending response', 'error');
        }
    }

    async updateTicketFromModal(ticketId) {
        const newStatus = document.getElementById('ticketStatusUpdate').value;
        const newPriority = document.getElementById('ticketPriorityUpdate').value;

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({ 
                    status: newStatus,
                    priority: newPriority
                })
            });

            if (response.ok) {
                this.showNotification('Ticket updated successfully', 'success');
                this.closeModal('ticketManageModal');
                await this.loadTickets(); // Reload tickets to reflect changes
            } else {
                throw new Error('Failed to update ticket');
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            this.showNotification('Error updating ticket', 'error');
        }
    }

    async getAuthToken() {
        try {
            return await window.Clerk.session?.getToken();
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }
}

// Initialize admin dashboard when Clerk is loaded
window.addEventListener('load', () => {
    // Wait for Clerk to load
    const checkClerk = setInterval(() => {
        if (window.Clerk?.loaded) {
            clearInterval(checkClerk);
            window.adminDashboard = new AdminDashboard();
        }
    }, 100);
});