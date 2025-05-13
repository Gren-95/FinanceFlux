// Main app.js file for client-side functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('app.js: DOMContentLoaded event fired'); // New log
  // Auth modal handling
  const authModal = document.getElementById('auth-modal');
  const signinBtn = document.getElementById('signin-btn');
  const getStartedBtn = document.getElementById('get-started-btn');
  const closeBtn = document.querySelector('.close-btn');
  const signinForm = document.getElementById('signin-form');
  const authError = document.getElementById('auth-error');
  const signoutBtn = document.getElementById('signout-btn');

  // Open auth modal
  function openAuthModal() {
    console.log('app.js: openAuthModal called'); // New log
    if (authModal) {
      authModal.classList.add('show');
    }
  }

  // Close auth modal
  function closeAuthModal() {
    if (authModal) {
      authModal.classList.remove('show');
    }
  }

  // Event listeners for opening auth modal
  if (signinBtn) {
    signinBtn.addEventListener('click', openAuthModal);
  }

  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', openAuthModal);
  }

  // Event listener for closing auth modal
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAuthModal);
  }
  // Close modal when clicking outside of it
  window.addEventListener('click', (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });
  
  // Handle keyboard navigation and accessibility
  if (authModal) {
    // Close modal with Escape key
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && authModal.classList.contains('show')) {
        closeAuthModal();
      }
    });
    
    // Trap focus within modal when open
    authModal.addEventListener('keydown', (event) => {
      if (!event.key === 'Tab') return;
      
      // Get all focusable elements in modal
      const focusableElements = authModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // If Shift+Tab on first element, move to last element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, move to first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    });
    
    // Focus first input when modal opens
    const modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target === authModal && authModal.classList.contains('show')) {
          setTimeout(() => {
            const firstInput = authModal.querySelector('input');
            if (firstInput) firstInput.focus();
          }, 50);
        }
      });
    });
    
    modalObserver.observe(authModal, { attributes: true, attributeFilter: ['class'] });
  }
  // Handle sign in form submission
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      console.log('app.js: signinForm submit event fired'); // New log
      e.preventDefault();
      
      // Clear previous error messages
      authError.textContent = '';
      
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      // Form validation
      if (!email || !password) {
        authError.textContent = 'Please fill in all fields';
        return;
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        authError.textContent = 'Please enter a valid email address';
        return;
      }
      
      try {
        // Show loading state
        const submitButton = signinForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Signing in...';
        submitButton.disabled = true;
        
        const response = await fetch('/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        
        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed');
        }
        
        // Successful login, redirect to the returnTo URL
        window.location.href = data.returnTo;
        
      } catch (error) {
        authError.textContent = error.message;
      }
    });
  }
  
  // Handle sign out
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Sign out error:', error);
      }
    });
  }
  
  // Check authentication status on page load
  async function checkAuthStatus() {
    try {
      const response = await fetch('/auth/status');
      return await response.json();
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { isAuthenticated: false, user: null };
    }
  }
  
  // Initialize any components that need auth status
  async function initializeApp() {
    const authStatus = await checkAuthStatus();
    console.log('Auth status:', authStatus);
    
    // You can use the auth status to initialize other components here
  }
  
  // Initialize the app
  initializeApp();
});
