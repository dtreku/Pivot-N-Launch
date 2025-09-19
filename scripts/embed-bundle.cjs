#!/usr/bin/env node
// Script to embed the bundled routes directly into the Netlify function
// This avoids Netlify's function bundler scanning for dependencies

const fs = require('fs');
const path = require('path');

// Read the bundled routes
const bundlePath = path.join(__dirname, '../dist/routes.js');
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Escape the bundle content for embedding as a string
const escapedBundle = bundleContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\${/g, '\\${');

// Create the embedded function
const functionContent = `// Netlify function with embedded bundle to avoid dependency scanning
let handlerCache = null;

module.exports.handler = async (event, context) => {
  // Initialize handler if not cached
  if (!handlerCache) {
    try {
      // Execute the bundled code directly instead of requiring a file
      const bundleCode = \`${escapedBundle}\`;
      
      // Create a module object for the bundle to export to
      const bundleModule = { exports: {} };
      
      // Execute the bundle code with proper module context
      const bundleFunction = new Function('module', 'exports', 'require', '__dirname', '__filename', bundleCode);
      bundleFunction(bundleModule, bundleModule.exports, require, __dirname, __filename);
      
      // Get the handler from the executed bundle
      handlerCache = bundleModule.exports.handler || bundleModule.exports.default;
      
      if (!handlerCache) {
        throw new Error('Handler not found in bundled code');
      }
      
      console.log('Successfully initialized embedded bundle handler');
    } catch (error) {
      console.error('Failed to initialize embedded bundle:', error);
      
      // Return error response
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Internal server error - failed to initialize application',
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      };
    }
  }
  
  // Execute the cached handler
  return handlerCache(event, context);
};`;

// Write the embedded function
const functionPath = path.join(__dirname, '../netlify/functions/server.js');
fs.writeFileSync(functionPath, functionContent);

console.log('✅ Successfully embedded bundle into Netlify function');
console.log(`📦 Bundle size: ${(bundleContent.length / 1024 / 1024).toFixed(2)}MB`);
console.log(`📁 Function file: ${functionPath}`);