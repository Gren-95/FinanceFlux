import { createServer } from './server.js';

console.log('Starting server...');
const server = await createServer();
console.log(`Server is running on http://localhost:${server.port}`);
console.log('Try accessing http://localhost:3000/invoices/1');
console.log('Test credentials:');
console.log('  Email: valid@example.com');
console.log('  Password: correctpassword');
