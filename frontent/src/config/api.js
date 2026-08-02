/**
 * API Configuration
 * Automatically uses the correct API URL based on environment
 */

// Get API URL from environment variable, fallback to localhost for development
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Log the API URL in development
if (import.meta.env.DEV) {
  console.log("API URL:", API_URL);
}
