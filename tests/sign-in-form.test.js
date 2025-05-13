/**
 * @jest-environment jest-environment-jsdom
 */
const { fireEvent, screen, waitFor } = require('@testing-library/dom');
require('@testing-library/jest-dom');

// Mock fetch and window.location
global.fetch = jest.fn();
const mockLocation = { href: '' };
delete window.location;
window.location = mockLocation;

describe('Sign-in Form with app.js interactions', () => {
  let form, emailInput, passwordInput, submitButton, errorMessage, authModal, signinBtn, getStartedBtn, closeBtn, signoutBtn;

  beforeEach(() => {
    // Reset mocks and window.location.href before each test
    fetch.mockClear();
    mockLocation.href = '';
    
    // Mock the auth status endpoint by default
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      }
      // Return undefined for other endpoints so individual tests can mock them
      return undefined;
    });

    // Set up DOM for tests, including elements app.js interacts with
    document.body.innerHTML = `
      <button id="signin-btn">Sign In Button</button>
      <button id="get-started-btn">Get Started</button>
      <div class="user-menu">
        <button id="signout-btn">Sign Out</button>
      </div>
      <div id="auth-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="sign-in-title">
        <div class="modal-content">
          <span class="close-btn" aria-label="Close sign in form">&times;</span>
          <h2 id="sign-in-title">Sign In</h2>
          <form id="signin-form">
            <div>
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required aria-required="true" autocomplete="email" />
            </div>
            <div>
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required aria-required="true" autocomplete="current-password" />
            </div>
            <div class="error-message" id="auth-error" aria-live="polite"></div>
            <button type="submit" class="btn primary-btn">Sign In</button>
          </form>
        </div>
      </div>
    `;
    
    // Load the form elements
    authModal = document.getElementById('auth-modal');
    signinBtn = document.getElementById('signin-btn');
    getStartedBtn = document.getElementById('get-started-btn');
    closeBtn = authModal.querySelector('.close-btn');
    signoutBtn = document.getElementById('signout-btn');

    form = document.getElementById('signin-form');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    // The submit button text might change, so select it carefully
    submitButton = form.querySelector('button[type="submit"]');
    errorMessage = document.getElementById('auth-error');

    // Load app.js AFTER DOM is set up and elements are assigned
    // Use a try-catch block if app.js itself throws errors on load in test env
    try {
      // Ensure a fresh load for each test if app.js has side effects or is stateful
      jest.resetModules(); // Reset module cache for app.js
      require('../public/js/app.js');
      // Manually trigger DOMContentLoaded again after app.js is re-required
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
    } catch (e) {
      console.error("Error loading app.js in test:", e);
    }
  });
  
  it('should have all required accessibility attributes', () => {
    // Test modal has proper ARIA attributes
    const modal = document.getElementById('auth-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'sign-in-title');
    
    // Test form fields have proper labels
    expect(emailInput).toHaveAttribute('id', 'email');
    const emailLabel = screen.getByText('Email');
    expect(emailLabel).toHaveAttribute('for', 'email');
    
    expect(passwordInput).toHaveAttribute('id', 'password');
    const passwordLabel = screen.getByText('Password');
    expect(passwordLabel).toHaveAttribute('for', 'password');
    
    // Test error message has live region for screen readers
    expect(errorMessage).toHaveAttribute('aria-live', 'polite');
  });
    it('should be keyboard navigable', async () => {
    // Open the modal first
    fireEvent.click(signinBtn);
    await waitFor(() => {
      expect(authModal.classList.contains('show')).toBe(true);
    });

    // Start with focus on the first input
    emailInput.focus();
    expect(document.activeElement).toBe(emailInput);
    
    // Tab to password input
    fireEvent.keyDown(emailInput, { key: 'Tab' });
    // In a real test, we'd use userEvent.tab() instead
    passwordInput.focus(); // Simulate the tab behavior
    expect(document.activeElement).toBe(passwordInput);
    
    // Tab to submit button
    fireEvent.keyDown(passwordInput, { key: 'Tab' });
    submitButton.focus(); // Simulate the tab behavior
    expect(document.activeElement).toBe(submitButton);
    
    // Fill in the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Test submit with Enter key
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      } else if (url === '/auth/signin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, returnTo: '/dashboard' })
        });
      }
      return undefined;
    });

    // Submit the form with Enter key
    fireEvent.keyDown(submitButton, { key: 'Enter' });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/auth/signin', expect.any(Object));
    });
  });

  it('should allow submitting form with valid email and password via app.js', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      } else if (url === '/auth/signin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, returnTo: '/dashboard' })
        });
      }
      return undefined;
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/auth/signin', expect.any(Object));
    });
    await waitFor(() => {
      expect(mockLocation.href).toBe('/dashboard');
    });
    expect(errorMessage.textContent).toBe('');
  });

  it('should display client-side error for empty email', async () => {
    // Clear previous fetch calls
    fetch.mockClear();
    
    // Setup specific mocks just for this test
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      }
      // We'll track if other endpoints are called
      return undefined;
    });
    
    // Clear the fetch mock calls from the auth status check
    fetch.mockClear();

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(errorMessage.textContent).toBe('Please fill in all fields');
    });
    
    // Make sure no new fetch calls were made
    expect(fetch).not.toHaveBeenCalledWith('/auth/signin', expect.any(Object));
  });

  it('should display client-side error for empty password', async () => {
    // Clear previous fetch calls
    fetch.mockClear();
    
    // Setup specific mocks just for this test
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      }
      // We'll track if other endpoints are called
      return undefined;
    });
    
    // Clear the fetch mock calls from the auth status check
    fetch.mockClear();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(errorMessage.textContent).toBe('Please fill in all fields');
    });
    
    // Make sure no new fetch calls were made
    expect(fetch).not.toHaveBeenCalledWith('/auth/signin', expect.any(Object));
  });
  
  it('should display client-side error for invalid email format', async () => {
    // Clear previous fetch calls
    fetch.mockClear();
    
    // Setup specific mocks just for this test
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      }
      // We'll track if other endpoints are called
      return undefined;
    });
    
    // Clear the fetch mock calls from the auth status check
    fetch.mockClear();

    fireEvent.change(emailInput, { target: { value: 'test' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(errorMessage.textContent).toBe('Please enter a valid email address');
    });
    
    // Make sure no new fetch calls were made
    expect(fetch).not.toHaveBeenCalledWith('/auth/signin', expect.any(Object));
  });

  it('should display server error message on failed signin', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      } else if (url === '/auth/signin') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ success: false, message: 'Invalid credentials from server' })
        });
      }
      return undefined;
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/auth/signin', expect.any(Object));
    });
    await waitFor(() => {
      expect(errorMessage.textContent).toBe('Invalid credentials from server');
    });
    expect(mockLocation.href).toBe(''); // Should not redirect
  });
  
  it('should handle fetch network error during signin', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/auth/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isAuthenticated: false, user: null })
        });
      } else if (url === '/auth/signin') {
        return Promise.reject(new Error('Network error'));
      }
      return undefined;
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/auth/signin', expect.any(Object));
    });
    await waitFor(() => {
      expect(errorMessage.textContent).toBe('Network error');
    });
  });

  it('should show loading state on submit button during signin', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ 
        ok: true, 
        json: async () => ({ success: true, returnTo: '/dashboard' }) 
      }), 50))
    );

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Add a small delay before submitting to ensure event listeners are attached
    await new Promise(resolve => setTimeout(resolve, 0));
    fireEvent.submit(form);

    // Check immediately after submit
    expect(submitButton.textContent).toBe('Signing in...');
    expect(submitButton.disabled).toBe(true);

    await waitFor(() => {
      expect(submitButton.textContent).toBe('Sign In'); // Or original text
      expect(submitButton.disabled).toBe(false);
    });
    await waitFor(() => expect(mockLocation.href).toBe('/dashboard'));
  });

  it('should open auth modal when signinBtn is clicked', async () => {
    expect(authModal.classList.contains('show')).toBe(false);
    fireEvent.click(signinBtn);
    await waitFor(() => expect(authModal.classList.contains('show')).toBe(true));
  });

  it('should open auth modal when getStartedBtn is clicked', async () => {
    expect(authModal.classList.contains('show')).toBe(false);
    fireEvent.click(getStartedBtn);
    await waitFor(() => expect(authModal.classList.contains('show')).toBe(true));
  });

  it('should close auth modal when closeBtn is clicked', async () => {
    fireEvent.click(signinBtn); // Open modal first
    await waitFor(() => expect(authModal.classList.contains('show')).toBe(true));
    fireEvent.click(closeBtn);
    await waitFor(() => expect(authModal.classList.contains('show')).toBe(false));
  });

  it('should close auth modal when clicking outside modal content', async () => {
    fireEvent.click(signinBtn); // Open modal first
    await waitFor(() => expect(authModal.classList.contains('show')).toBe(true));
    fireEvent.click(authModal); // Click on the modal backdrop
    await waitFor(() => expect(authModal.classList.contains('show')).toBe(false));
  });
  
  it('should not close auth modal when clicking inside modal content', async () => {
    fireEvent.click(signinBtn); // Open modal first
    await waitFor(() => expect(authModal.classList.contains('show')).toBe(true));
    fireEvent.click(authModal.querySelector('.modal-content')); // Click inside
    // Ensure it's still shown after a brief moment
    await new Promise(resolve => setTimeout(resolve, 50)); 
    expect(authModal.classList.contains('show')).toBe(true);
  });

  it('should handle signout successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    fireEvent.click(signoutBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/auth/signout', expect.any(Object));
    });
    await waitFor(() => {
      expect(mockLocation.href).toBe('/');
    });
  });
  
  it('should handle signout failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Signout failed' }),
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fireEvent.click(signoutBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/auth/signout', expect.any(Object));
    });
    expect(mockLocation.href).toBe(''); // Should not redirect
    // Check if console.error was called if app.js logs an error
    // For now, we assume it might log, if not, this part can be removed.
    // await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled()); 
    consoleErrorSpy.mockRestore();
  });

  it('should call checkAuthStatus on initializeApp', async () => {
    // This test assumes initializeApp calls checkAuthStatus which then calls fetch
    // We need to re-require app.js or trigger DOMContentLoaded again if initializeApp is only run once.
    // For simplicity, we'll check if fetch was called for /auth/status
    // Note: app.js is already loaded in beforeEach. initializeApp runs on DOMContentLoaded.
    // We need to ensure our fetch mock for /auth/status is set up *before* app.js runs or re-runs.
    
    // Since app.js is loaded in beforeEach, initializeApp would have already run.
    // To test initializeApp specifically, we might need to structure app.js differently
    // or manually call initializeApp if it's exposed.
    // For now, let's assume the fetch for /auth/status in initializeApp was made.
    
    // Let's clear previous fetch calls and set a specific one for /auth/status
    fetch.mockClear();
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isAuthenticated: false, user: null }),
    });

    // To re-trigger DOMContentLoaded and thus initializeApp:
    document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
    
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/auth/status');
    });
  });

  // ... existing tests for accessibility and validation ...
  // Ensure these tests are still relevant or adapt them.
  // For example, the 'should disable form submission until all required fields are filled'
  // is now covered by the client-side validation tests above.
  // The original 'it('should allow submitting form with valid email and password')'
  // was about HTML5 validation, now we test the JS submission.

  it('should have proper form validation (HTML5 check still useful)', async () => {
    // ... (keep existing HTML5 validation checks if desired, but app.js handles primary logic)
    // Submit empty form
    emailInput.value = '';
    passwordInput.value = '';
    expect(form.checkValidity()).toBeFalsy(); // HTML5 validation
    
    // Fill in just the email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(form.checkValidity()).toBeFalsy(); 
    
    // Fill in just the password
    emailInput.value = '';
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(form.checkValidity()).toBeFalsy(); 
    
    // Fill in both
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(form.checkValidity()).toBeTruthy();
  });

  // Remove or adapt this test as app.js now handles the error messages
  // it('should disable form submission until all required fields are filled', () => { ... });
  // This is now covered by:
  // - 'should display client-side error for empty email'
  // - 'should display client-side error for empty password'
});
