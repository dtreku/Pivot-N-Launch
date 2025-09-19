// Import the pre-built serverless routes bundle
// This includes all dependencies bundled and ready to use
const routesModule = require("../../dist/routes.js");

// Export the handler from the bundled routes
module.exports.handler = routesModule.handler || routesModule.default;