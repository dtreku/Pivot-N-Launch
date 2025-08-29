const serverless = require("serverless-http");
const express = require("express");
const path = require("path");

// Create express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../../dist/public");
  app.use(express.static(staticPath));
}

// Import routes directly from the built server
let routesInitialized = false;

const initializeRoutes = async () => {
  if (!routesInitialized) {
    try {
      const { registerRoutes } = require("../../dist/index.js");
      await registerRoutes(app);
      routesInitialized = true;
      console.log("Routes registered successfully");
    } catch (err) {
      console.error("Error registering routes:", err);
      throw err;
    }
  }
};

// Handle client-side routing for SPA
app.get("*", (req, res) => {
  // Don't handle API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  
  // Serve index.html for all other routes (SPA routing)
  if (process.env.NODE_ENV === "production") {
    const indexPath = path.join(__dirname, "../../dist/public/index.html");
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not found - development mode");
  }
});

// Create serverless handler with route initialization
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Initialize routes on first request
  await initializeRoutes();
  return handler(event, context);
};