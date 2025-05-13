/**
 * @jest-environment jest-environment-jsdom
 */
// Using jest-environment-jsdom ensures document is available globally

const { axe, toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

describe('Sign-in Form Accessibility', () => {
  beforeEach(() => {
    
    // Setup DOM for testing
    document.body.innerHTML = `
      <div id="sign-in-modal" role="dialog" aria-modal="true" aria-labelledby="sign-in-title">
        <h2 id="sign-in-title">Sign In</h2>
        <form id="sign-in-form">
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" aria-required="true" autocomplete="email" />
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" aria-required="true" autocomplete="current-password" />
          </div>
          <div id="error-message" class="error" aria-live="polite"></div>
          <button type="submit">Sign In</button>
        </form>
      </div>
    `;
  });
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper keyboard navigation sequence', () => {
    // Get all focusable elements in the modal
    const focusableElements = Array.from(document.querySelectorAll('#sign-in-modal button, #sign-in-modal input'));
    
    // Check that the tab order follows a logical sequence
    expect(focusableElements.map(el => el.id || el.textContent)).toEqual([
      'email',
      'password',
      'Sign In'
    ]);
  });
  
  it('should have proper screen reader announcements', () => {
    // Set the error message
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Email or password is incorrect';
    
    // Check that it has the aria-live attribute for screen readers
    expect(errorMessage).toHaveAttribute('aria-live', 'polite');
  });
  
  it('should have proper form field labels', () => {
    // Check email input
    const emailInput = document.getElementById('email');
    const emailLabel = document.querySelector('label[for="email"]');
    
    expect(emailLabel).not.toBeNull();
    expect(emailLabel.textContent).toBe('Email');
    expect(emailInput).toHaveAttribute('aria-required', 'true');
    
    // Check password input
    const passwordInput = document.getElementById('password');
    const passwordLabel = document.querySelector('label[for="password"]');
    
    expect(passwordLabel).not.toBeNull();
    expect(passwordLabel.textContent).toBe('Password');
    expect(passwordInput).toHaveAttribute('aria-required', 'true');
  });
  
  it('should have appropriate autocomplete attributes', () => {
    // Check email input has email autocomplete
    const emailInput = document.getElementById('email');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
    
    // Check password input has current-password autocomplete
    const passwordInput = document.getElementById('password');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
  
  it('should have proper dialog attributes', () => {
    const modal = document.getElementById('sign-in-modal');
    
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'sign-in-title');
  });
});
