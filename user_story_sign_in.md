# I can sign in

Unauthenticated visitor who lands on any protected URL (e.g., /invoices/3) is shown a sign-in form while the browser address bar stays the same URL.

Entering a valid email + password in that overlay reloads the same URL and reveals the requested page within 2 seconds.

Entering an invalid email or password keeps the user on the same URL, leaves the overlay open, and shows a generic "Email or password is incorrect" message.

The inline form includes a Forgot password? link that launches the password-reset flow without changing the current URL.

Each password character is masked during typing and never stored in client-side logs.

Five failed attempts in 10 minutes lock the account for 15 minutes and display a lockout message.

Successful sign-in issues a Secure, HttpOnly, SameSite=strict session cookie that expires after 30 minutes of inactivity.

If an already-authenticated user tries accessing a protected URL, the page loads directly with no sign-in overlay.

The sign-in form is fully keyboard-navigable and its labels are announced by screen readers (WCAG 2.1 AA compliant).
