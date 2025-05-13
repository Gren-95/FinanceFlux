import { startServer } from './src/app';

// Start the Express server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});