// Dark Mode Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Add smooth transition effect
            body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                body.style.transition = '';
            }, 300);
        });
    }
    
    // Initialize all components
    initializeNavigation();
    initializeHeroAnimations();
    initializeROICalculator();
    initializeAdvancedCalculator();
    initializeCountdownTimer();
    initializeUrgencyTimer();
    initializeVideoPlayer();
    initializeTestimonials();
    initializeScrollAnimations();
    initializeFAQ();
    initializeNewsletterForm();
    initializeMobileMenu();
});

// Navigation Functionality
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    // Smooth scrolling for anchor links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - navbar.offsetHeight;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Mobile Menu Functionality
function initializeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Hero Animations
function initializeHeroAnimations() {
    // Animate floating cards
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 2}s`;
    });
    
    // Animate hero stats on scroll
    const heroStats = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    heroStats.forEach(stat => {
        observer.observe(stat);
    });
}

// ROI Calculator Functionality
function initializeROICalculator() {
    const investmentInput = document.getElementById('investment');
    const hoursSlider = document.getElementById('hours');
    const businessTypeSelect = document.getElementById('businessType');
    const hoursValueDisplay = document.querySelector('.range-value');
    
    // Update displays
    if (hoursSlider && hoursValueDisplay) {
        hoursSlider.addEventListener('input', function() {
            hoursValueDisplay.textContent = `${this.value} hours`;
            calculateROI();
        });
    }
    
    if (investmentInput) {
        investmentInput.addEventListener('input', calculateROI);
    }
    
    if (businessTypeSelect) {
        businessTypeSelect.addEventListener('change', calculateROI);
    }
    
    // Initial calculation
    calculateROI();
    
    // Initialize chart if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initializeProjectionChart();
    }
}

function calculateROI() {
    const investment = parseFloat(document.getElementById('investment')?.value) || 499;
    const hours = parseFloat(document.getElementById('hours')?.value) || 10;
    const businessType = document.getElementById('businessType')?.value || 'saas';
    
    // Business type multipliers
    const multipliers = {
        saas: { revenue: 8.5, margin: 0.85 },
        ecommerce: { revenue: 5.0, margin: 0.30 },
        agency: { revenue: 12.0, margin: 0.70 },
        content: { revenue: 6.5, margin: 0.60 }
    };
    
    const multiplier = multipliers[businessType];
    const baseRevenue = hours * multiplier.revenue * 50; // Base calculation
    const monthlyRevenue = Math.round(baseRevenue);
    const monthlyProfit = Math.round(monthlyRevenue * multiplier.margin);
    const annualProfit = monthlyProfit * 12;
    const roi = Math.round(((annualProfit - investment) / investment) * 100);
    const paybackWeeks = Math.ceil(investment / (monthlyProfit / 4.33));
    
    // Update displays
    updateElement('monthlyRevenue', `$${monthlyRevenue.toLocaleString()}`);
    updateElement('annualProfit', `$${annualProfit.toLocaleString()}`);
    updateElement('roi', `${roi}%`);
    updateElement('payback', `${paybackWeeks} weeks`);
}

// Advanced Calculator for Sales Page
function initializeAdvancedCalculator() {
    const hoursWeekSlider = document.getElementById('hoursWeek');
    const currentIncomeInput = document.getElementById('currentIncome');
    const growthRateSelect = document.getElementById('growthRate');
    const reinvestSelect = document.getElementById('reinvest');
    
    if (!hoursWeekSlider) return;
    
    // Update hours display
    const valueDisplay = hoursWeekSlider.nextElementSibling;
    hoursWeekSlider.addEventListener('input', function() {
        valueDisplay.textContent = `${this.value} hours`;
        calculateAdvancedROI();
    });
    
    // Add event listeners to other inputs
    [currentIncomeInput, growthRateSelect, reinvestSelect].forEach(element => {
        if (element) {
            element.addEventListener('change', calculateAdvancedROI);
        }
    });
    
    // Initial calculation
    calculateAdvancedROI();
}

function calculateAdvancedROI() {
    const hours = parseFloat(document.getElementById('hoursWeek')?.value) || 10;
    const currentIncome = parseFloat(document.getElementById('currentIncome')?.value) || 3000;
    const growthRate = document.getElementById('growthRate')?.value || 'moderate';
    const reinvest = document.getElementById('reinvest')?.value || 'yes';
    
    // Growth rate multipliers
    const growthMultipliers = {
        conservative: 0.8,
        moderate: 1.0,
        aggressive: 1.3
    };
    
    const baseMultiplier = growthMultipliers[growthRate];
    const reinvestMultiplier = reinvest === 'yes' ? 1.2 : 1.0;
    
    // Calculate projections
    const baseMonthly = (hours * 125) * baseMultiplier; // Base calculation
    const month1 = Math.round(baseMonthly * 0.3);
    const month3 = Math.round(baseMonthly * 0.7 * reinvestMultiplier);
    const month6 = Math.round(baseMonthly * 1.2 * reinvestMultiplier);
    const month12 = Math.round(baseMonthly * 2.0 * reinvestMultiplier);
    
    // Update displays
    updateElement('month1', `$${month1.toLocaleString()}`);
    updateElement('month3', `$${month3.toLocaleString()}`);
    updateElement('month6', `$${month6.toLocaleString()}`);
    updateElement('month12', `$${month12.toLocaleString()}`);
}

// Projection Chart
function initializeProjectionChart() {
    const ctx = document.getElementById('projectionChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
            datasets: [{
                label: 'Projected Revenue',
                data: [1250, 2100, 3750, 5200, 6800, 7500],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Countdown Timer
function initializeCountdownTimer() {
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (!hoursEl || !minutesEl || !secondsEl) return;
    
    let timeLeft = 24 * 60 * 60; // 24 hours in seconds
    
    function updateTimer() {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
        
        if (timeLeft > 0) {
            timeLeft--;
        } else {
            timeLeft = 24 * 60 * 60; // Reset to 24 hours
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Urgency Timer for Sales Page
function initializeUrgencyTimer() {
    const urgencyTimer = document.getElementById('urgencyTimer');
    if (!urgencyTimer) return;
    
    let timeLeft = 24 * 60 * 60; // 24 hours in seconds
    
    function updateUrgencyTimer() {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        
        urgencyTimer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft > 0) {
            timeLeft--;
        } else {
            timeLeft = 24 * 60 * 60; // Reset
        }
    }
    
    updateUrgencyTimer();
    setInterval(updateUrgencyTimer, 1000);
}

// Video Player
function initializeVideoPlayer() {
    const videoPlaceholder = document.querySelector('.video-placeholder');
    if (!videoPlaceholder) return;
    
    videoPlaceholder.addEventListener('click', function() {
        // Replace with actual video embed
        const videoHTML = `
            <iframe width="100%" height="450" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                frameborder="0" allowfullscreen>
            </iframe>
        `;
        this.innerHTML = videoHTML;
    });
}

// Testimonials Functionality
function initializeTestimonials() {
    const loadMoreBtn = document.getElementById('loadMoreReviews');
    if (!loadMoreBtn) return;
    
    const additionalReviews = [
        {
            name: "Jennifer Wang",
            avatar: "https://i.pravatar.cc/150?img=15",
            title: "Finally making real money online!",
            text: "After 3 failed business attempts, this was my breakthrough. The AI SaaS came with everything I needed. Now making $6,800/month and growing!",
            revenue: "$6,800/mo",
            time: "2 months"
        },
        {
            name: "Marcus Johnson",
            avatar: "https://i.pravatar.cc/150?img=18",
            title: "Passive income at its finest",
            text: "Set it up in 3 days, hired a VA for $4/hour to manage everything. I literally do nothing and make $4,200/month. This is the real deal!",
            revenue: "$4,200/mo",
            time: "Passive"
        },
        {
            name: "Sofia Rodriguez",
            avatar: "https://i.pravatar.cc/150?img=22",
            title: "Life-changing investment",
            text: "Was working 60 hours a week for $3K/month. Now working 15 hours and making $9,500/month. This business gave me my life back!",
            revenue: "$9,500/mo",
            time: "15hrs/week"
        }
    ];
    
    loadMoreBtn.addEventListener('click', function() {
        const reviewsGrid = document.querySelector('.reviews-grid');
        
        additionalReviews.forEach(review => {
            const reviewCard = createReviewCard(review);
            reviewsGrid.appendChild(reviewCard);
        });
        
        this.style.display = 'none';
        
        // Animate new cards
        const newCards = reviewsGrid.querySelectorAll('.review-card:nth-last-child(-n+3)');
        newCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });
    });
}

function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
        <div class="review-header">
            <img src="${review.avatar}" alt="${review.name}" class="reviewer-avatar">
            <div class="reviewer-info">
                <h4>${review.name}</h4>
                <span class="review-date">Verified Buyer • 1 month ago</span>
            </div>
            <div class="review-rating">⭐⭐⭐⭐⭐</div>
        </div>
        <h3 class="review-title">${review.title}</h3>
        <p class="review-text">${review.text}</p>
        <div class="review-proof">
            <span class="proof-badge">💰 Revenue: ${review.revenue}</span>
            <span class="proof-badge">⏰ Time: ${review.time}</span>
        </div>
    `;
    return card;
}

// Load More Testimonials for Sales Page
function loadMoreTestimonials() {
    const testimonialsContainer = document.querySelector('.testimonial-cards');
    if (!testimonialsContainer) return;
    
    const moreTestimonials = [
        {
            name: "Amanda Foster",
            avatar: "https://i.pravatar.cc/150?img=28",
            text: "Skeptical at first, but results speak for themselves. From $0 to $7,200/month in just 6 weeks. The support team is incredible!",
            proof: "Revenue+Screenshot:+$7,200"
        },
        {
            name: "Kevin Chen",
            avatar: "https://i.pravatar.cc/150?img=35",
            text: "College debt was crushing me. This business paid off my $40K loans in 8 months. Now I'm debt-free and making $11K/month!",
            proof: "Bank+Statement:+$11,000"
        },
        {
            name: "Lisa Thompson",
            avatar: "https://i.pravatar.cc/150?img=41",
            text: "Stay-at-home mom making more than my engineer husband! Started with their basic package, now earning $13K/month consistently.",
            proof: "PayPal+Dashboard:+$13,245"
        }
    ];
    
    moreTestimonials.forEach(testimonial => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.innerHTML = `
            <img src="${testimonial.avatar}" alt="${testimonial.name}" class="testimonial-avatar">
            <h4>${testimonial.name}</h4>
            <div class="verified-badge">✓ Verified Purchase</div>
            <div class="stars">⭐⭐⭐⭐⭐</div>
            <p class="testimonial-text">"${testimonial.text}"</p>
            <img src="https://via.placeholder.com/600x300/f0f0f0/333?text=${testimonial.proof}" alt="Revenue Proof" class="proof-image">
        `;
        testimonialsContainer.appendChild(card);
    });
}

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.problem-card, .business-card, .review-card, .faq-item, .testimonial-card, .solution-item, .included-item');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// FAQ Functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Close other FAQ items (accordion behavior)
            faqItems.forEach(otherItem => {
                if (otherItem !== this) {
                    otherItem.classList.remove('active');
                }
            });
        });
    });
}

// Newsletter Form
function initializeNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value;
        const button = this.querySelector('button');
        const originalText = button.textContent;
        
        // Simple email validation
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Simulate API call
        button.textContent = 'Subscribing...';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = 'Subscribed!';
            this.querySelector('input[type="email"]').value = '';
            showNotification('Successfully subscribed to our newsletter!', 'success');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }, 1500);
    });
}

// Utility Functions
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function animateNumber(element) {
    const target = parseInt(element.textContent.replace(/[^\d]/g, ''));
    const duration = 2000;
    const start = performance.now();
    const startValue = 0;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startValue + (target - startValue) * easeOutCubic);
        
        // Format number based on original content
        if (element.textContent.includes('$')) {
            element.textContent = '$' + current.toLocaleString() + (element.textContent.includes('M') ? 'M+' : 
                                   element.textContent.includes('K') ? 'K+' : '');
        } else if (element.textContent.includes('%')) {
            element.textContent = current + '%';
        } else {
            element.textContent = current.toLocaleString() + (element.textContent.includes('+') ? '+' : '');
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '400px',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = 'background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0; margin-left: auto;';
    
    const removeNotification = () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    };
    
    closeBtn.addEventListener('click', removeNotification);
    
    // Auto remove after 5 seconds
    setTimeout(removeNotification, 5000);
}

// Scroll to Checkout Function
function scrollToCheckout() {
    const checkoutSection = document.getElementById('checkout');
    if (checkoutSection) {
        checkoutSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add CSS for animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .animate-in {
        animation: slideInUp 0.6s ease forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .navbar.scrolled {
        background: rgba(248, 250, 252, 0.95) !important;
        backdrop-filter: blur(20px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    [data-theme="dark"] .navbar.scrolled {
        background: rgba(15, 23, 42, 0.95) !important;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
    
    .nav-menu.active {
        display: flex !important;
        position: fixed;
        top: 80px;
        left: 0;
        right: 0;
        background: var(--bg-primary);
        flex-direction: column;
        padding: 2rem;
        border-bottom: 1px solid var(--border-color);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }
    
    .faq-item.active {
        background: var(--bg-secondary);
        transform: scale(1.02);
    }
    
    .faq-item.active .faq-question::after {
        content: " ▼";
        color: var(--primary);
    }
    
    @media (max-width: 768px) {
        .nav-menu {
            display: none;
        }
        
        .hamburger {
            display: flex !important;
        }
        
        .nav-menu.active {
            display: flex !important;
        }
    }
`;

document.head.appendChild(animationStyles);

// Performance optimization - lazy loading for images
document.addEventListener('DOMContentLoaded', function() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
});

// Add smooth scrolling to all internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Track user engagement
let engagementData = {
    timeOnPage: 0,
    scrollDepth: 0,
    interactionsCount: 0
};

// Track time on page
setInterval(() => {
    engagementData.timeOnPage += 1;
}, 1000);

// Track scroll depth
window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.pageYOffset;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    engagementData.scrollDepth = Math.max(engagementData.scrollDepth, scrollPercent);
});

// Track interactions
document.addEventListener('click', (e) => {
    if (e.target.matches('button, a, input, select, .clickable')) {
        engagementData.interactionsCount++;
    }
});

// Checkout Modal Functionality
function openCheckout(packageType, price) {
    const modal = document.getElementById('checkoutModal');
    const itemName = document.getElementById('orderItemName');
    const itemPrice = document.getElementById('orderItemPrice');
    const orderTotal = document.getElementById('orderTotal');
    const payAmount = document.getElementById('payAmount');
    const orderDiscount = document.getElementById('orderDiscount');
    
    // Package details
    const packages = {
        starter: { name: 'White Label AI SaaS - Starter Package', discount: 96492 },
        pro: { name: 'White Label AI SaaS - Professional Package', discount: 96192 },
        empire: { name: 'White Label AI SaaS - Empire Package', discount: 95492 }
    };
    
    const selectedPackage = packages[packageType];
    
    itemName.textContent = selectedPackage.name;
    itemPrice.textContent = `$${price}`;
    orderTotal.textContent = `$${price}`;
    payAmount.textContent = price;
    orderDiscount.textContent = `-$${selectedPackage.discount.toLocaleString()}`;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add event listeners for modal close
    const closeBtn = modal.querySelector('.checkout-close');
    closeBtn.onclick = closeCheckout;
    
    window.onclick = function(event) {
        if (event.target == modal) {
            closeCheckout();
        }
    }
}

function closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function processPayment() {
    const payButton = document.querySelector('.pay-button');
    const payText = payButton.querySelector('.pay-text');
    const paySpinner = payButton.querySelector('.pay-spinner');
    
    // Get form data
    const email = document.getElementById('customerEmail').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVC = document.getElementById('cardCVC').value;
    const cardholderName = document.getElementById('cardholderName').value;
    const country = document.getElementById('country').value;
    
    // Validate form
    if (!email || !cardNumber || !cardExpiry || !cardCVC || !cardholderName || !country) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (cardNumber.replace(/\s/g, '').length < 13) {
        showNotification('Please enter a valid card number', 'error');
        return;
    }
    
    // Show loading state
    payButton.disabled = true;
    payText.style.opacity = '0';
    paySpinner.style.display = 'block';
    
    // Simulate payment processing
    setTimeout(() => {
        // Hide checkout modal
        closeCheckout();
        
        // Show success modal
        showSuccessModal();
        
        // Auto-redirect to thank you page after 3 seconds
        setTimeout(() => {
            window.location.href = 'thank-you.html';
        }, 4000);
        
        // Track conversion (you can replace this with actual tracking)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: 'WL_' + Date.now(),
                value: parseFloat(document.getElementById('payAmount').textContent),
                currency: 'USD',
                items: [{
                    item_id: 'white_label_saas',
                    item_name: document.getElementById('orderItemName').textContent,
                    price: parseFloat(document.getElementById('payAmount').textContent),
                    quantity: 1
                }]
            });
        }
    }, 3000);
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add celebration effect
    createConfetti();
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Redirect to thank you page
    showNotification('Redirecting to onboarding...', 'success');
    setTimeout(() => {
        window.location.href = 'thank-you.html';
    }, 2000);
}

// Card number formatting
document.addEventListener('DOMContentLoaded', function() {
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCVCInput = document.getElementById('cardCVC');
    
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
            e.target.value = formattedValue;
        });
    }
    
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    if (cardCVCInput) {
        cardCVCInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
});

// Confetti effect for success
function createConfetti() {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                top: -10px;
                left: ${Math.random() * 100}%;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                z-index: 10002;
                pointer-events: none;
                animation: confetti-fall 3s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 50);
    }
}

// Add confetti animation to CSS
const confettiStyles = document.createElement('style');
confettiStyles.textContent = `
    @keyframes confetti-fall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(confettiStyles);

// Enhanced testimonials loading
function loadMoreTestimonials() {
    const testimonialsContainer = document.querySelector('.testimonial-cards');
    if (!testimonialsContainer) return;
    
    const moreTestimonials = [
        {
            name: "Amanda Foster - 'ContentGenius AI'",
            avatar: "https://i.pravatar.cc/150?img=28",
            text: "I rebranded the platform as 'ContentGenius AI' and nobody knows I didn't build it. Just closed a $500K Series A funding round! Investors think I'm the next big AI entrepreneur.",
            proof: "Funding+Round+$500K"
        },
        {
            name: "Kevin Chen - 'SmartBusiness Tools'",
            avatar: "https://i.pravatar.cc/150?img=35",
            text: "'SmartBusiness Tools' is now a $2M ARR company with 25 employees. Started with this white label platform and built an empire. Going public next year!",
            proof: "Company+Valuation+$15M"
        },
        {
            name: "Lisa Thompson - 'AI Marketing Pro'",
            avatar: "https://i.pravatar.cc/150?img=41",
            text: "Built 'AI Marketing Pro' into the #1 AI marketing platform for small businesses. 5,000+ customers paying $197/month. Just got acquisition offers over $50M!",
            proof: "Revenue+Dashboard+$985K"
        }
    ];
    
    moreTestimonials.forEach((testimonial, index) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.innerHTML = `
            <img src="${testimonial.avatar}" alt="${testimonial.name}" class="testimonial-avatar">
            <h4>${testimonial.name}</h4>
            <div class="verified-badge">✓ Verified Purchase</div>
            <div class="stars">⭐⭐⭐⭐⭐</div>
            <p class="testimonial-text">"${testimonial.text}"</p>
            <img src="https://via.placeholder.com/600x300/f0f0f0/333?text=${testimonial.proof}" alt="Proof" class="proof-image">
        `;
        testimonialsContainer.appendChild(card);
        
        // Animate in
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Hide the button
    const button = document.querySelector('.secondary-button');
    if (button && button.textContent.includes('Show 47 More')) {
        button.style.display = 'none';
    }
}

// Console welcome message
console.log('%c🚀 Welcome to ReadyMade Hustles!', 'color: #3b82f6; font-size: 24px; font-weight: bold;');
console.log('%cBuilt with modern web technologies for the best user experience.', 'color: #64748b; font-size: 14px;');
console.log('%c💡 Interested in our development services? Contact us!', 'color: #10b981; font-size: 14px;');
console.log('%c🛡️ Checkout is in demo mode - no real payments processed', 'color: #f59e0b; font-size: 12px;');