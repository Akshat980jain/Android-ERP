/**
 * API Configuration
 * 
 * This file manages the API base URL for different environments.
 * 
 * DEVELOPMENT:
 * - Update LOCAL_IP with your computer's IP address
 * - Find your IP: Run "ipconfig" (Windows) or "ifconfig" (Mac/Linux)
 * - Look for IPv4 Address under your active network adapter
 * 
 * PRODUCTION:
 * - Set IS_PRODUCTION to true
 * - Update PRODUCTION_URL with your hosted server URL
 */

// ==================== CONFIGURATION ====================

// Set to true when deploying to production
const IS_PRODUCTION = false;

// Your local computer's IP address (update this when it changes)
const LOCAL_IP = '192.168.1.11';

// Your production server URL (update before deploying)
const PRODUCTION_URL = 'https://your-domain.com/api';

// ==================== DO NOT EDIT BELOW ====================

const LOCAL_PORT = '5000';
const API_ENDPOINT = '/api';

export const API_CONFIG = {
    BASE_URL: IS_PRODUCTION
        ? PRODUCTION_URL
        : `http://${LOCAL_IP}:${LOCAL_PORT}${API_ENDPOINT}`,

    IS_PRODUCTION,
    LOCAL_IP,
    PRODUCTION_URL,

    // Helper to get the current environment
    getEnvironment: () => IS_PRODUCTION ? 'production' : 'development',

    // Helper to log current configuration (useful for debugging)
    logConfig: () => {
        console.log('=== API Configuration ===');
        console.log('Environment:', IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT');
        console.log('Base URL:', API_CONFIG.BASE_URL);
        console.log('========================');
    }
};

// Log configuration on app start (only in development)
if (!IS_PRODUCTION && __DEV__) {
    API_CONFIG.logConfig();
}
