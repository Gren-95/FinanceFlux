// Main app.js file for client-side functionality
document.addEventListener('DOMContentLoaded', () => {
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

  // Handle sign in form submission
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
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
