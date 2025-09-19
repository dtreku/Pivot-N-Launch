// Netlify function that imports the bundled routes without triggering dependency scanning
const path = require('path');

// Cache the handler to avoid reloading
let handlerCache = null;

module.exports.handler = async (event, context) => {
  // Initialize handler if not cached
  if (!handlerCache) {
    try {
      // Import the bundled routes using eval to avoid static analysis
      const bundlePath = path.join(__dirname, '../../dist/routes.js');
      const routesModule = eval('require')(bundlePath);
      handlerCache = routesModule.handler || routesModule.default;
      
      if (!handlerCache) {
        throw new Error('Handler not found in bundled routes');
      }
    } catch (error) {
      console.error('Failed to load bundled routes:', error);
      
      // Fallback response if bundled routes fail to load
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Internal server error - failed to load application routes',
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      };
    }
  }
  
  // Execute the cached handler
  return handlerCache(event, context);
};