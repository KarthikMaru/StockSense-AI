const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI defined in the environment variables.
 * Exits the process if the connection fails, since the API cannot function
 * without a database connection.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not defined in the environment variables");
    }

    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(uri);

    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected. Attempting to reconnect is handled by the driver.");
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Failed to connect: ${error.message}`);
    // Fail fast in production; in development, keep the process alive so
    // the developer can see logs and fix configuration without a crash loop.
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
