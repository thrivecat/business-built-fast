// Simple backup onboarding script to ensure basic functionality

console.log('Backup onboarding script loaded');

// Simple variables
let currentStep = 0;
const maxSteps = 9; // 0-9 (10 total steps)

// Simple next step function
function nextStep() {
    console.log('Simple nextStep called, current step:', currentStep);
    
    // Hide current step
    const currentStepElement = document.querySelector('.form-step.active');
    if (currentStepElement) {
        currentStepElement.classList.remove('active');
    }
    
    // Move to next step
    if (currentStep < maxSteps) {
        currentStep++;
        console.log('Moving to step:', currentStep);
        
        // Show next step
        const nextStepElement = document.getElementById('step' + (currentStep + 1));
        if (nextStepElement) {
            nextStepElement.classList.add('active');
            console.log('Activated step:', currentStep + 1);
        } else {
            console.error('Next step element not found:', 'step' + (currentStep + 1));
        }
        
        // Update progress
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            const progressPercent = ((currentStep + 1) / 10) * 100;
            progressFill.style.width = progressPercent + '%';
        }
        
        // Update step counter
        const currentStepCounter = document.getElementById('currentStep');
        if (currentStepCounter) {
            currentStepCounter.textContent = currentStep + 1;
        }
        
        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Simple previous step function
function prevStep() {
    console.log('Simple prevStep called, current step:', currentStep);
    
    if (currentStep > 0) {
        // Hide current step
        const currentStepElement = document.querySelector('.form-step.active');
        if (currentStepElement) {
            currentStepElement.classList.remove('active');
        }
        
        // Move to previous step
        currentStep--;
        console.log('Moving to step:', currentStep);
        
        // Show previous step
        const prevStepElement = document.getElementById('step' + (currentStep + 1));
        if (prevStepElement) {
            prevStepElement.classList.add('active');
        }
        
        // Update progress
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            const progressPercent = ((currentStep + 1) / 10) * 100;
            progressFill.style.width = progressPercent + '%';
        }
        
        // Update step counter
        const currentStepCounter = document.getElementById('currentStep');
        if (currentStepCounter) {
            currentStepCounter.textContent = currentStep + 1;
        }
        
        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Simple submit function
function submitForm() {
    console.log('Simple submit function called');
    alert('Form would be submitted here! (This is just a demo)');
    
    // Show success screen
    const currentStepElement = document.querySelector('.form-step.active');
    if (currentStepElement) {
        currentStepElement.classList.remove('active');
    }
    
    const successScreen = document.getElementById('submitSuccess');
    if (successScreen) {
        successScreen.style.display = 'block';
    }
}

// Password visibility toggle function
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentNode.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// File upload handling with security validation
function handleFileUpload(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (!file) return;
    
    // Security validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload only image files (JPEG, PNG, GIF, SVG)');
        input.value = '';
        return;
    }
    
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        input.value = '';
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 8px;">
            <p style="margin-top: 8px; font-size: 12px; color: #666;">${file.name}</p>
        `;
    };
    reader.readAsDataURL(file);
}

// Drag and drop functionality
function setupDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');
    
    uploadAreas.forEach(area => {
        const input = area.querySelector('input[type="file"]');
        const previewId = input.getAttribute('data-preview');
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            area.addEventListener(eventName, () => area.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, () => area.classList.remove('drag-over'), false);
        });
        
        // Handle dropped files
        area.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileUpload(input, previewId);
            }
        }, false);
    });
}

// Make sure functions are globally available
window.nextStep = nextStep;
window.prevStep = prevStep;
window.submitForm = submitForm;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleFileUpload = handleFileUpload;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - backup script initializing');
    
    // Make sure first step is active
    const firstStep = document.getElementById('step1');
    if (firstStep && !firstStep.classList.contains('active')) {
        firstStep.classList.add('active');
        console.log('Activated first step');
    }
    
    // Setup drag and drop for file uploads
    setupDragAndDrop();
    
    console.log('Backup script initialized');
    console.log('Functions available:', typeof window.nextStep, typeof window.prevStep, typeof window.submitForm);
});

console.log('Backup onboarding script ready');