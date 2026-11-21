const express = require("express");

const logger = require("./middleware/logger");
const studentRoutes = require("./routes/studentRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Custom middleware: every request is logged to the terminal.
app.use(logger);

// Parse JSON request bodies (needed for POST and PUT).
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.status(200).send("Student Management API is running. Try GET /students.");
});

// Modular routing: all student endpoints live in routes/studentRoutes.js
app.use("/students", studentRoutes);

// 404 for any route that was not matched above.
app.use((req, res) => {
  res.status(404).json({ success: false, message: "That endpoint does not exist." });
});

// Central error handler. Keeps malformed JSON as a 400 instead of a 500.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body is not valid JSON." });
  }

  console.error("[server error]", err);
  res.status(500).json({ success: false, message: "Something went wrong on the server." });
});

const server = app.listen(PORT, () => {
  console.log("");
  console.log("  STUDENT MANAGEMENT API");
  console.log("  Web Dev III - Unit 2 - Lab Assignment 2");
  console.log(`  http://localhost:${PORT}`);
  console.log("  3 seed records in memory - no database");
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
