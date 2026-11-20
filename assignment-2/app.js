const express = require("express");
const path = require("path");

const logger = require("./middleware/logger");
const studentRoutes = require("./routes/studentRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// The front-end is a plain HTML/CSS/JS page served by Express.
// It sits before the logger so that static assets do not fill the terminal.
app.use(express.static(path.join(__dirname, "public")));

// Custom middleware: every API request is logged with status and duration.
app.use(logger);

// Parse JSON request bodies (needed for POST and PUT).
app.use(express.json());

// Modular routing: all student endpoints live in routes/studentRoutes.js
app.use("/students", studentRoutes);

// 404 for any route that was not matched above.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    details: [`${req.method} ${req.originalUrl} does not exist on this server.`]
  });
});

// Central error handler. Keeps malformed JSON as a 400 instead of a 500.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON body",
      details: ["Request body must contain valid JSON."]
    });
  }

  console.error("[server error]", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: ["Something went wrong while handling the request."]
  });
});

const server = app.listen(PORT, () => {
  console.log("");
  console.log("  STUDENT MANAGEMENT REST API");
  console.log("  Web Dev III - Unit 2 - Lab Assignment 2");
  console.log(`  http://localhost:${PORT}`);
  console.log("  5 seed records in memory - no database");
  console.log("");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use. Stop the other server or run: PORT=3001 npm start\n`);
    process.exit(1);
  }
  throw error;
});

module.exports = app;
