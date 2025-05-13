const express = require('express');
const path = require('path');
const fs = require('fs');
const hbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
let db;
(async () => {
  // Ensure database directory exists
  const dbDir = path.join(__dirname, 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  try {
    db = await open({
      filename: path.join(__dirname, 'db', 'fluxfinance.sqlite'),
      driver: sqlite3.Database
    });
    
    // Check if users table exists
    const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users';");
    if (!tableCheck) {
      console.log("Database tables don't exist. Please run 'npm run db:init' first.");
    }
    
    global.db = db;
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
})();

// View engine setup
app.engine('hbs', hbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'fluxfinance-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Authentication middleware
app.use((req, res, next) => {
  // Make auth status available to all templates
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  res.locals.user = req.session.user || null;
  next();
});

// Protected route middleware
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  
  // Store the original URL to redirect after successful login
  req.session.returnTo = req.originalUrl;
  
  // For AJAX requests, send a 401 status
  if (req.xhr) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Show auth modal by setting a flag (handled by frontend)
  res.locals.showAuthModal = true;
  return next();
};

// Import route modules
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// Route registration
app.use('/auth', authRoutes);
app.use('/dashboard', requireAuth, dashboardRoutes);

// Protected routes (require authentication)
app.get('/:id(\\d+)', requireAuth, async (req, res) => {
  const id = req.params.id;
  // Render the page with the requested ID
  res.render('detail', { pageId: id, title: `Page ${id}` });
});

// Home route
app.get('/', (req, res) => {
  res.render('home', { title: 'FluxFinance' });
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app; // Export for testing
