// Server initialization for testing and production
const app = require('./app');

/**
 * Creates and starts a server with the app
 * @param {Object} options - Server options
 * @param {boolean} options.testing - Whether to use testing mode
 * @param {number} options.port - Port to listen on (default: 3000 or random for testing)
 * @returns {Object} Server object with close method and port property
 */
async function createServer(options = {}) {
  const { testing = false, port = testing ? 0 : 3000 } = options;
  
  // Start the server
  const server = app.listen(port);
  
  // Get the actual port (especially important for random testing ports)
  const actualPort = server.address().port;
  
  // Return server object with needed properties
  return {
    port: actualPort,
    close: () => {
      return new Promise((resolve) => {
        server.close(resolve);
      });
    }
  };
}

// Start the server if this module is run directly
if (require.main === module) {
  createServer().then(server => {
    console.log(`Server listening on port ${server.port}`);
  });
}

module.exports = { createServer }; 