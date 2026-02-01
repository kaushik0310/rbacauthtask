require("dotenv").config();
const app = require("./app");
const config = require("./config/index");

const PORT = config.Port;
let server;

// Start the server
server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
});

// Handle server startup errors
server.on("error", (error) => {
  console.error("Server startup error:", error.message);
  process.exit(1); // Exit the process on startup failure
});
process.on("SIGINT", async () => {
  console.log("SIGINT received: Shutting down gracefully");

  // Close the server and perform cleanup tasks
  if (server) {
    server.close(async () => {
      console.log("Express server closed");

      // // Close MySQL pool connection
      async function closeMySQLConnection() {
        try {
          await pool.end();
          console.log("MySQL pool connection closed");
        } catch (error) {
          console.error("Error closing MySQL pool:", error.message);
        }
      }

      process.exit(0); // Exit the process gracefully
    });
  } else {
    process.exit(0); // If server is not defined, exit directly
  }
});



