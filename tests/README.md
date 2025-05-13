# FinanceFlux Tests

This directory contains tests for the FinanceFlux application, with a focus on the authentication functionality.

## Sign-In Tests

The tests cover the user story: "I can sign in" with the following acceptance criteria:

1. Unauthenticated visitor who lands on any protected URL (e.g., /3) is shown a sign-in form instead and the browser address bar stays on the same URL.
2. Entering an email + password allows to submit the form (using AJAX)
3. Entering an invalid email or password shows a generic "Email or password is incorrect" message.
4. If an already-authenticated user hits a protected URL, the page loads directly with no sign-in overlay.
5. The sign-in form is fully keyboard-navigable and its labels are announced by screen readers (WCAG 2.1 AA compliant).
6. If the credentials are right the page is refreshed, revealing the page the user initially wanted to visit (e.g. /3)

## Test Files

- **auth.api.test.js**: Tests the authentication API endpoints
- **protected-routes.test.js**: Tests the behavior of protected routes for authenticated and unauthenticated users
- **sign-in-form.test.js**: Tests the sign-in form functionality, including form validation and submission
- **sign-in-e2e.test.js**: End-to-end tests for the sign-in flow
- **sign-in-accessibility.test.js**: Tests for WCAG 2.1 AA compliance and accessibility features

## Running the Tests

To run the tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test -- tests/auth.api.test.js
```

## Coverage Report

A coverage report will be generated in the `coverage` directory after running the tests.
