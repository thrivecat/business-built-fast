// Onboarding Form JavaScript

// Global variables
let currentStepIndex = 0;
const totalSteps = 9;
let formData = {};
let isSubmitting = false;

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing onboarding form...');
    initializeOnboardingForm();
});

// Also initialize when the script loads (fallback)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOnboardingForm);
} else {
    // DOM is already loaded
    initializeOnboardingForm();
}

function initializeOnboardingForm() {
    console.log('Starting onboarding form initialization...');
    
    // Check if we're on the right page
    if (!document.querySelector('.onboarding-container')) {
        console.log('Not on onboarding page, skipping initialization');
        return;
    }
    
    // Set initial progress
    updateProgress();
    
    // Show first step
    showStep(0);
    
    // Initialize color picker synchronization
    setupColorPickers();
    
    // Initialize conditional fields
    setupConditionalFields();
    
    // Initialize form validation
    setupFormValidation();
    
    // Initialize file upload handling
    setupFileUploads();
    
    // Initialize feature selection limits
    setupFeatureSelection();
    
    // Set up keyboard navigation
    setupKeyboardNavigation();
    
    console.log('Onboarding form initialized successfully');
    console.log('Current step index:', currentStepIndex);
    console.log('Next step function available:', typeof window.nextStep);
}

// Navigation Functions - Make sure these are globally accessible
window.nextStep = function nextStep() {
    console.log('nextStep called, current step:', currentStepIndex);
    
    if (validateCurrentStep()) {
        console.log('Step validation passed');
        saveCurrentStepData();
        
        if (currentStepIndex === totalSteps - 1) {
            // On final step, generate review content
            console.log('Generating review content for final step');
            generateReviewContent();
        }
        
        if (currentStepIndex < totalSteps - 1) {
            currentStepIndex++;
            console.log('Moving to step:', currentStepIndex);
            showStep(currentStepIndex);
            updateProgress();
            scrollToTop();
        }
    } else {
        console.log('Step validation failed');
    }
}

window.prevStep = function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        showStep(currentStepIndex);
        updateProgress();
        scrollToTop();
    }
}

function showStep(stepIndex) {
    // Hide all steps
    const steps = document.querySelectorAll('.form-step');
    steps.forEach((step, index) => {
        step.classList.remove('active');
        if (index === stepIndex) {
            step.classList.add('active');
            
            // Add entrance animation
            const content = step.querySelector('.step-content');
            content.classList.remove('slide-in-left', 'slide-in-right');
            
            // Determine animation direction
            if (stepIndex > currentStepIndex) {
                content.classList.add('slide-in-right');
            } else if (stepIndex < currentStepIndex) {
                content.classList.add('slide-in-left');
            }
        }
    });
    
    // Update step indicator
    document.getElementById('currentStep').textContent = stepIndex + 1;
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;
    progressFill.style.width = `${progressPercent}%`;
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Data Management
function saveCurrentStepData() {
    const currentStep = document.querySelector('.form-step.active');
    const inputs = currentStep.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (!formData[input.name]) {
                formData[input.name] = [];
            }
            if (input.checked) {
                if (!formData[input.name].includes(input.value)) {
                    formData[input.name].push(input.value);
                }
            } else {
                formData[input.name] = formData[input.name].filter(val => val !== input.value);
            }
        } else if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else if (input.type === 'file') {
            if (input.files.length > 0) {
                formData[input.name] = input.files[0];
            }
        } else {
            formData[input.name] = input.value;
        }
    });
    
    console.log('Step data saved:', formData);
}

// Validation Functions
function validateCurrentStep() {
    console.log('Validating current step:', currentStepIndex);
    const currentStep = document.querySelector('.form-step.active');
    
    if (!currentStep) {
        console.error('No active step found!');
        return false;
    }
    
    // Step 0 (welcome step) has no required inputs, always valid
    if (currentStepIndex === 0) {
        console.log('Welcome step, automatically valid');
        return true;
    }
    
    const requiredInputs = currentStep.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    console.log('Found required inputs:', requiredInputs.length);
    
    // Clear previous errors
    clearValidationErrors(currentStep);
    
    requiredInputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // Additional custom validations
    if (currentStepIndex === 2) { // Branding step
        isValid = validateBrandingStep() && isValid;
    } else if (currentStepIndex === 5) { // Feature selection step
        isValid = validateFeatureSelection() && isValid;
    } else if (currentStepIndex === 6) { // Legal step
        isValid = validateLegalStep() && isValid;
    }
    
    if (!isValid) {
        showNotification('Please fill in all required fields correctly', 'error');
        // Scroll to first error
        const firstError = currentStep.querySelector('.field-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    return isValid;
}

function validateInput(input) {
    const fieldGroup = input.closest('.field-group');
    let isValid = true;
    let errorMessage = '';
    
    // Check if required field is empty
    if (input.hasAttribute('required') && !input.value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (input.type === 'email' && input.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // URL validation
    if (input.type === 'url' && input.value) {
        try {
            new URL(input.value);
        } catch {
            isValid = false;
            errorMessage = 'Please enter a valid URL (include http:// or https://)';
        }
    }
    
    // Phone validation (basic)
    if (input.type === 'tel' && input.value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;\n        if (!phoneRegex.test(input.value.replace(/[^\\d\\+]/g, ''))) {\n            isValid = false;\n            errorMessage = 'Please enter a valid phone number';\n        }\n    }\n    \n    // Company name validation\n    if (input.name === 'companyName' && input.value) {\n        if (input.value.length < 2) {\n            isValid = false;\n            errorMessage = 'Company name must be at least 2 characters';\n        }\n    }\n    \n    // Update field state\n    if (isValid) {\n        fieldGroup.classList.remove('error');\n        fieldGroup.classList.add('success');\n        removeFieldError(fieldGroup);\n    } else {\n        fieldGroup.classList.remove('success');\n        fieldGroup.classList.add('error');\n        showFieldError(fieldGroup, errorMessage);\n    }\n    \n    return isValid;\n}\n\nfunction validateBrandingStep() {\n    // Check if company name is provided\n    const companyName = document.getElementById('companyName').value;\n    if (!companyName || companyName.length < 2) {\n        showFieldError(\n            document.getElementById('companyName').closest('.field-group'),\n            'Company name is required and must be at least 2 characters'\n        );\n        return false;\n    }\n    return true;\n}\n\nfunction validateFeatureSelection() {\n    const checkedFeatures = document.querySelectorAll('input[name=\"priorityFeatures\"]:checked');\n    if (checkedFeatures.length === 0) {\n        showNotification('Please select at least 1 priority feature', 'error');\n        return false;\n    }\n    if (checkedFeatures.length > 5) {\n        showNotification('Please select no more than 5 priority features', 'error');\n        return false;\n    }\n    return true;\n}\n\nfunction validateLegalStep() {\n    const requiredAgreements = ['termsAgree', 'setupAgree', 'supportAgree', 'brandingAgree'];\n    let allChecked = true;\n    \n    requiredAgreements.forEach(agreementId => {\n        const checkbox = document.getElementById(agreementId);\n        if (!checkbox.checked) {\n            allChecked = false;\n            const fieldGroup = checkbox.closest('.field-group');\n            fieldGroup.classList.add('error');\n            showFieldError(fieldGroup, 'This agreement is required');\n        }\n    });\n    \n    return allChecked;\n}\n\nfunction clearValidationErrors(container) {\n    const errorGroups = container.querySelectorAll('.field-group.error');\n    errorGroups.forEach(group => {\n        group.classList.remove('error', 'success');\n        removeFieldError(group);\n    });\n}\n\nfunction showFieldError(fieldGroup, message) {\n    removeFieldError(fieldGroup);\n    const errorDiv = document.createElement('div');\n    errorDiv.className = 'field-error';\n    errorDiv.textContent = message;\n    fieldGroup.appendChild(errorDiv);\n}\n\nfunction removeFieldError(fieldGroup) {\n    const existingError = fieldGroup.querySelector('.field-error');\n    if (existingError) {\n        existingError.remove();\n    }\n}\n\n// Feature Selection Functions\nfunction setupFeatureSelection() {\n    const featureCheckboxes = document.querySelectorAll('input[name=\"priorityFeatures\"]');\n    \n    featureCheckboxes.forEach(checkbox => {\n        checkbox.addEventListener('change', function() {\n            const checkedFeatures = document.querySelectorAll('input[name=\"priorityFeatures\"]:checked');\n            \n            if (checkedFeatures.length > 5) {\n                this.checked = false;\n                showNotification('You can select up to 5 priority features', 'warning');\n            }\n            \n            // Update visual feedback\n            updateFeatureSelectionFeedback(checkedFeatures.length);\n        });\n    });\n}\n\nfunction updateFeatureSelectionFeedback(selectedCount) {\n    const feedbackElement = document.querySelector('.feature-selection-feedback');\n    if (!feedbackElement) {\n        const feedback = document.createElement('div');\n        feedback.className = 'feature-selection-feedback';\n        feedback.style.cssText = 'text-align: center; margin-top: 1rem; font-weight: 600;';\n        document.querySelector('.feature-grid').parentNode.appendChild(feedback);\n    }\n    \n    const feedback = document.querySelector('.feature-selection-feedback');\n    feedback.textContent = `${selectedCount}/5 features selected`;\n    feedback.style.color = selectedCount > 5 ? 'var(--onboard-danger)' : 'var(--onboard-primary)';\n}\n\n// Color Picker Functions\nfunction setupColorPickers() {\n    setupColorPicker('primaryColor', 'primaryColorText');\n    setupColorPicker('secondaryColor', 'secondaryColorText');\n}\n\nfunction setupColorPicker(colorInputId, textInputId) {\n    const colorInput = document.getElementById(colorInputId);\n    const textInput = document.getElementById(textInputId);\n    \n    if (colorInput && textInput) {\n        colorInput.addEventListener('input', function() {\n            textInput.value = this.value;\n        });\n        \n        textInput.addEventListener('input', function() {\n            if (this.value.match(/^#[0-9A-Fa-f]{6}$/)) {\n                colorInput.value = this.value;\n            }\n        });\n        \n        // Initialize text input with color value\n        textInput.value = colorInput.value;\n    }\n}\n\n// Conditional Fields\nfunction setupConditionalFields() {\n    const hostingProvider = document.getElementById('hostingProvider');\n    if (hostingProvider) {\n        hostingProvider.addEventListener('change', function() {\n            const hostingDetails = document.getElementById('hostingDetails');\n            if (this.value === 'existing') {\n                hostingDetails.style.display = 'block';\n                hostingDetails.querySelector('textarea').required = true;\n            } else {\n                hostingDetails.style.display = 'none';\n                hostingDetails.querySelector('textarea').required = false;\n            }\n        });\n    }\n}\n\n// File Upload Functions\nfunction setupFileUploads() {\n    const logoInput = document.getElementById('logoFile');\n    if (logoInput) {\n        logoInput.addEventListener('change', function() {\n            if (this.files[0]) {\n                const file = this.files[0];\n                \n                // Validate file type\n                if (!file.type.startsWith('image/')) {\n                    showNotification('Please select an image file', 'error');\n                    this.value = '';\n                    return;\n                }\n                \n                // Validate file size (5MB max)\n                if (file.size > 5 * 1024 * 1024) {\n                    showNotification('Image file must be less than 5MB', 'error');\n                    this.value = '';\n                    return;\n                }\n                \n                showNotification(`Logo \"${file.name}\" uploaded successfully`, 'success');\n            }\n        });\n    }\n}\n\n// Form Validation Setup\nfunction setupFormValidation() {\n    // Real-time validation for certain fields\n    const emailInput = document.getElementById('email');\n    if (emailInput) {\n        emailInput.addEventListener('blur', function() {\n            validateInput(this);\n        });\n    }\n    \n    // Add validation to competitor URL inputs\n    const competitorInputs = document.querySelectorAll('.competitor-input');\n    competitorInputs.forEach(input => {\n        input.addEventListener('blur', function() {\n            if (this.value && this.value.trim()) {\n                // Add https:// if no protocol specified\n                if (!this.value.startsWith('http://') && !this.value.startsWith('https://')) {\n                    this.value = 'https://' + this.value;\n                }\n                validateInput(this);\n            }\n        });\n    });\n}\n\n// Keyboard Navigation\nfunction setupKeyboardNavigation() {\n    document.addEventListener('keydown', function(e) {\n        // Allow Enter key to proceed to next step (except in textareas)\n        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {\n            e.preventDefault();\n            const nextButton = document.querySelector('.form-step.active .btn-primary');\n            if (nextButton && !nextButton.disabled) {\n                nextButton.click();\n            }\n        }\n        \n        // Allow Escape key to go back\n        if (e.key === 'Escape') {\n            const backButton = document.querySelector('.form-step.active .btn-secondary');\n            if (backButton) {\n                backButton.click();\n            }\n        }\n    });\n}\n\n// Review Content Generation\nfunction generateReviewContent() {\n    const reviewContainer = document.getElementById('reviewContent');\n    reviewContainer.innerHTML = '';\n    \n    const sections = [\n        {\n            title: '👋 Personal Information',\n            fields: ['firstName', 'lastName', 'email', 'phone', 'timezone', 'businessType']\n        },\n        {\n            title: '🎨 Branding',\n            fields: ['companyName', 'preferredDomain', 'primaryColor', 'secondaryColor', 'brandStyle', 'tagline']\n        },\n        {\n            title: '🖥️ Hosting & Technical',\n            fields: ['hostingProvider', 'databasePreference', 'sslCertificate', 'technicalContact']\n        },\n        {\n            title: '🔍 Market & Competition',\n            fields: ['targetAudience', 'uniqueValue', 'pricingStrategy']\n        },\n        {\n            title: '⚙️ Features & Customization',\n            fields: ['priorityFeatures', 'customFeatures', 'integrations', 'userRoles']\n        },\n        {\n            title: '📋 Business & Legal',\n            fields: ['businessCountry', 'businessState', 'businessStructure', 'dataRetention']\n        },\n        {\n            title: '🎯 Additional Requirements',\n            fields: ['launchTimeline', 'launchDate', 'marketingSupport', 'trainingNeeds', 'specialRequests', 'budget']\n        }\n    ];\n    \n    sections.forEach(section => {\n        const sectionDiv = document.createElement('div');\n        sectionDiv.className = 'review-section';\n        sectionDiv.innerHTML = `<h3>${section.title}</h3>`;\n        \n        section.fields.forEach(fieldName => {\n            if (formData[fieldName] && formData[fieldName] !== '') {\n                const reviewItem = document.createElement('div');\n                reviewItem.className = 'review-item';\n                \n                const label = getFieldLabel(fieldName);\n                const value = formatFieldValue(fieldName, formData[fieldName]);\n                \n                reviewItem.innerHTML = `\n                    <div class=\"review-label\">${label}</div>\n                    <div class=\"review-value\">${value}</div>\n                `;\n                \n                sectionDiv.appendChild(reviewItem);\n            }\n        });\n        \n        // Only add section if it has content\n        if (sectionDiv.children.length > 1) {\n            reviewContainer.appendChild(sectionDiv);\n        }\n    });\n    \n    // Add competitor sites if any are filled\n    const competitors = document.querySelectorAll('.competitor-input');\n    const competitorUrls = Array.from(competitors)\n        .map(input => input.value)\n        .filter(url => url && url.trim());\n    \n    if (competitorUrls.length > 0) {\n        const competitorSection = document.createElement('div');\n        competitorSection.className = 'review-section';\n        competitorSection.innerHTML = `\n            <h3>🏢 Competitor Websites</h3>\n            <div class=\"review-item\">\n                <div class=\"review-label\">Competitor URLs</div>\n                <div class=\"review-value\">${competitorUrls.map(url => `<a href=\"${url}\" target=\"_blank\">${url}</a>`).join('<br>')}</div>\n            </div>\n        `;\n        reviewContainer.appendChild(competitorSection);\n    }\n}\n\nfunction getFieldLabel(fieldName) {\n    const labels = {\n        firstName: 'First Name',\n        lastName: 'Last Name',\n        email: 'Email Address',\n        phone: 'Phone Number',\n        timezone: 'Timezone',\n        businessType: 'Business Type',\n        companyName: 'Company Name',\n        preferredDomain: 'Preferred Domain',\n        primaryColor: 'Primary Color',\n        secondaryColor: 'Secondary Color',\n        brandStyle: 'Brand Style',\n        tagline: 'Tagline',\n        hostingProvider: 'Hosting Provider',\n        databasePreference: 'Database Preference',\n        sslCertificate: 'SSL Certificate',\n        technicalContact: 'Technical Contact',\n        targetAudience: 'Target Audience',\n        uniqueValue: 'Unique Value Proposition',\n        pricingStrategy: 'Pricing Strategy',\n        priorityFeatures: 'Priority Features',\n        customFeatures: 'Custom Features',\n        integrations: 'Required Integrations',\n        userRoles: 'User Roles',\n        businessCountry: 'Business Country',\n        businessState: 'State/Province',\n        businessStructure: 'Business Structure',\n        dataRetention: 'Data Retention Policy',\n        launchTimeline: 'Launch Timeline',\n        launchDate: 'Launch Date',\n        marketingSupport: 'Marketing Support',\n        trainingNeeds: 'Training Requirements',\n        specialRequests: 'Special Requests',\n        budget: 'Additional Budget'\n    };\n    \n    return labels[fieldName] || fieldName;\n}\n\nfunction formatFieldValue(fieldName, value) {\n    if (Array.isArray(value)) {\n        return value.filter(v => v).join(', ');\n    }\n    \n    if (fieldName.includes('Color')) {\n        return `<span style=\"display: inline-block; width: 20px; height: 20px; background: ${value}; border-radius: 3px; margin-right: 8px; vertical-align: middle;\"></span>${value}`;\n    }\n    \n    if (fieldName === 'launchDate' && value) {\n        return new Date(value).toLocaleDateString();\n    }\n    \n    return value || 'Not specified';\n}\n\n// Form Submission\nwindow.submitForm = function submitForm() {\n    if (isSubmitting) return;\n    \n    // Final validation\n    if (!validateCurrentStep()) {\n        return;\n    }\n    \n    // Save final step data\n    saveCurrentStepData();\n    \n    isSubmitting = true;\n    const submitButton = document.getElementById('submitButton');\n    \n    // Show loading state\n    submitButton.classList.add('loading');\n    submitButton.disabled = true;\n    submitButton.textContent = 'Submitting...';\n    \n    // Simulate form submission (replace with actual submission logic)\n    setTimeout(() => {\n        // Here you would normally send the data to your backend\n        // For now, we'll just show the success screen\n        \n        console.log('Form submitted with data:', formData);\n        \n        // Log form data to console for development\n        console.log('=== ONBOARDING FORM SUBMISSION ===');\n        console.log('Timestamp:', new Date().toISOString());\n        console.log('Form Data:', JSON.stringify(formData, null, 2));\n        \n        // Show success screen\n        showSuccessScreen();\n        \n        // Reset button state\n        isSubmitting = false;\n        submitButton.classList.remove('loading');\n        submitButton.disabled = false;\n        submitButton.innerHTML = `\n            Submit Onboarding Form\n            <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">\n                <path d=\"M5 12h14M12 5l7 7-7 7\"/>\n            </svg>\n        `;\n        \n        // Send success notification\n        showNotification('Onboarding form submitted successfully!', 'success');\n        \n        // TODO: Replace this with actual email submission to admin\n        // sendToAdmin(formData);\n        \n    }, 3000);\n}\n\nfunction showSuccessScreen() {\n    // Hide current step\n    document.querySelector('.form-step.active').classList.remove('active');\n    \n    // Show success screen\n    const successScreen = document.getElementById('submitSuccess');\n    successScreen.style.display = 'block';\n    \n    // Update progress to 100%\n    document.getElementById('progressFill').style.width = '100%';\n    document.getElementById('currentStep').textContent = 'Complete';\n    \n    // Trigger celebration effects\n    createCelebration();\n    \n    scrollToTop();\n}\n\n// Celebration Effects\nfunction createCelebration() {\n    // Create confetti effect\n    for (let i = 0; i < 100; i++) {\n        setTimeout(() => {\n            createConfettiPiece();\n        }, i * 30);\n    }\n    \n    // Play success sound (if desired)\n    // playSuccessSound();\n}\n\nfunction createConfettiPiece() {\n    const colors = ['#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea'];\n    const confetti = document.createElement('div');\n    \n    confetti.style.cssText = `\n        position: fixed;\n        top: -10px;\n        left: ${Math.random() * 100}%;\n        width: ${Math.random() * 10 + 5}px;\n        height: ${Math.random() * 10 + 5}px;\n        background: ${colors[Math.floor(Math.random() * colors.length)]};\n        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};\n        z-index: 10000;\n        pointer-events: none;\n        animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;\n    `;\n    \n    document.body.appendChild(confetti);\n    \n    setTimeout(() => {\n        confetti.remove();\n    }, 5000);\n}\n\n// Add confetti animation styles\nconst confettiStyles = document.createElement('style');\nconfettiStyles.textContent = `\n    @keyframes confettiFall {\n        0% {\n            transform: translateY(-100vh) rotate(0deg);\n            opacity: 1;\n        }\n        100% {\n            transform: translateY(100vh) rotate(720deg);\n            opacity: 0;\n        }\n    }\n`;\ndocument.head.appendChild(confettiStyles);\n\n// Notification System (reuse from main script)\nfunction showNotification(message, type = 'info') {\n    const notification = document.createElement('div');\n    notification.className = `onboard-notification onboard-notification-${type}`;\n    notification.innerHTML = `\n        <span>${message}</span>\n        <button class=\"notification-close\">&times;</button>\n    `;\n    \n    // Add styles\n    Object.assign(notification.style, {\n        position: 'fixed',\n        top: '20px',\n        right: '20px',\n        padding: '1rem 1.5rem',\n        borderRadius: '10px',\n        color: 'white',\n        fontWeight: '600',\n        zIndex: '10001',\n        transform: 'translateX(100%)',\n        transition: 'transform 0.3s ease',\n        display: 'flex',\n        alignItems: 'center',\n        gap: '1rem',\n        maxWidth: '400px',\n        backgroundColor: type === 'success' ? 'var(--onboard-success)' : \n                         type === 'error' ? 'var(--onboard-danger)' : \n                         type === 'warning' ? 'var(--onboard-warning)' : 'var(--onboard-primary)'\n    });\n    \n    document.body.appendChild(notification);\n    \n    // Animate in\n    setTimeout(() => {\n        notification.style.transform = 'translateX(0)';\n    }, 100);\n    \n    // Close functionality\n    const closeBtn = notification.querySelector('.notification-close');\n    closeBtn.style.cssText = 'background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0; margin-left: auto;';\n    \n    const removeNotification = () => {\n        notification.style.transform = 'translateX(100%)';\n        setTimeout(() => {\n            if (notification.parentNode) {\n                document.body.removeChild(notification);\n            }\n        }, 300);\n    };\n    \n    closeBtn.addEventListener('click', removeNotification);\n    \n    // Auto remove after 5 seconds\n    setTimeout(removeNotification, 5000);\n}\n\n// Utility Functions\nfunction scrollToElement(element) {\n    element.scrollIntoView({\n        behavior: 'smooth',\n        block: 'center'\n    });\n}\n\nfunction debounce(func, wait) {\n    let timeout;\n    return function executedFunction(...args) {\n        const later = () => {\n            clearTimeout(timeout);\n            func(...args);\n        };\n        clearTimeout(timeout);\n        timeout = setTimeout(later, wait);\n    };\n}\n\n// Auto-save functionality (saves to localStorage)\nfunction autoSave() {\n    try {\n        localStorage.setItem('onboardingFormData', JSON.stringify(formData));\n        console.log('Form data auto-saved');\n    } catch (error) {\n        console.warn('Could not auto-save form data:', error);\n    }\n}\n\n// Load saved data on page load\nfunction loadSavedData() {\n    try {\n        const savedData = localStorage.getItem('onboardingFormData');\n        if (savedData) {\n            formData = JSON.parse(savedData);\n            populateFormWithSavedData();\n            console.log('Loaded saved form data');\n        }\n    } catch (error) {\n        console.warn('Could not load saved form data:', error);\n    }\n}\n\nfunction populateFormWithSavedData() {\n    Object.keys(formData).forEach(key => {\n        const element = document.querySelector(`[name=\"${key}\"]`);\n        if (element) {\n            if (element.type === 'checkbox') {\n                if (Array.isArray(formData[key])) {\n                    formData[key].forEach(value => {\n                        const checkbox = document.querySelector(`[name=\"${key}\"][value=\"${value}\"]`);\n                        if (checkbox) checkbox.checked = true;\n                    });\n                }\n            } else if (element.type === 'radio') {\n                const radio = document.querySelector(`[name=\"${key}\"][value=\"${formData[key]}\"]`);\n                if (radio) radio.checked = true;\n            } else {\n                element.value = formData[key];\n            }\n        }\n    });\n}\n\n// Initialize auto-save (every 30 seconds)\nsetInterval(() => {\n    if (Object.keys(formData).length > 0) {\n        autoSave();\n    }\n}, 30000);\n\n// Load saved data on initialization\ndocument.addEventListener('DOMContentLoaded', function() {\n    setTimeout(loadSavedData, 100);\n});\n\n// Clear saved data on successful submission\nfunction clearSavedData() {\n    try {\n        localStorage.removeItem('onboardingFormData');\n        console.log('Cleared saved form data');\n    } catch (error) {\n        console.warn('Could not clear saved form data:', error);\n    }\n}\n\n// TODO: Email submission function (placeholder)\n/*\nfunction sendToAdmin(formData) {\n    // This would integrate with Zepto Mail or similar service\n    // const emailData = {\n    //     to: 'admin@readymadehustles.com',\n    //     subject: `New Onboarding: ${formData.companyName || 'Unnamed Company'}`,\n    //     html: generateEmailHTML(formData)\n    // };\n    // \n    // // Send via Zepto Mail API\n    // fetch('/api/send-email', {\n    //     method: 'POST',\n    //     headers: {\n    //         'Content-Type': 'application/json',\n    //     },\n    //     body: JSON.stringify(emailData)\n    // });\n}\n\nfunction generateEmailHTML(data) {\n    // Generate a nicely formatted HTML email with all form data\n    return `\n        <h1>New White Label Onboarding</h1>\n        <h2>Company: ${data.companyName}</h2>\n        <h3>Contact: ${data.firstName} ${data.lastName}</h3>\n        <p>Email: ${data.email}</p>\n        <!-- Add all other form fields formatted nicely -->\n    `;\n}\n*/\n\nconsole.log('Onboarding form script loaded successfully');