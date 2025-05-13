import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createAuthRoutes } from './routes/auth';
import { AuthMiddleware } from './middleware/auth';
import { UserModel } from './models/user';
import { initDatabase } from './db/init-db';

async function startServer() {
  // Initialize database
  const db = await initDatabase();
  
  // Initialize models
  const userModel = new UserModel(db);
  
  // Initialize middleware
  const authMiddleware = new AuthMiddleware(userModel);
  
  const app = express();
  
  // Configure handlebars
  app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts')
  }));
  app.set('view engine', 'handlebars');
  app.set('views', path.join(__dirname, 'views'));
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fluxfinance-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000 // 30 minutes
    }
  }));
  
  // Routes
  app.use('/api/auth', createAuthRoutes(userModel));
  
  // Protected routes
  app.get('/invoices/:id', authMiddleware.requireAuth.bind(authMiddleware), (req, res) => {
    const invoiceId = req.params.id;
    // Logic to fetch and render invoice details would go here
    res.render('invoice-details', { 
      invoiceId,
      authenticated: req.session.authenticated
    });
  });
  
  // Home route
  app.get('/', (req, res) => {
    res.render('home', {
      authenticated: req.session.authenticated
    });
  });
  
  // Start server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export { startServer };
