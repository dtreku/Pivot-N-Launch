// Simple wrapper for Netlify Functions that imports and re-exports the serverless routes
const fs = require('fs');
const path = require('path');

// Create a function that will work with Netlify
async function createRegisterRoutesFunction() {
  try {
    // Read the compiled routes file and execute it in a proper Node.js context
    const routesPath = path.join(__dirname, '../dist/routes-serverless.js');
    
    if (!fs.existsSync(routesPath)) {
      throw new Error('Compiled routes file not found at: ' + routesPath);
    }
    
    // Delete from require cache to ensure fresh import
    delete require.cache[require.resolve(routesPath)];
    
    // Require the compiled routes
    const routes = require(routesPath);
    
    // Try multiple ways to get the registerRoutes function
    const registerRoutes = routes.registerRoutes || routes.default || routes;
    
    if (typeof registerRoutes !== 'function') {
      throw new Error('registerRoutes function not found. Available: ' + Object.keys(routes));
    }
    
    return registerRoutes;
  } catch (error) {
    console.error('Error loading routes:', error);
    // Return a fallback function that at least responds
    return function(app) {
      app.get('/api/health', (req, res) => {
        res.json({ status: 'error', message: 'Routes loading failed: ' + error.message });
      });
      return app;
    };
  }
}

module.exports = createRegisterRoutesFunction;
module.exports.createRegisterRoutesFunction = createRegisterRoutesFunction;
module.exports.registerRoutes = createRegisterRoutesFunction;