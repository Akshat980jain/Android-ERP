/**
 * API Configuration
 * 
 * Supports both local development and hosted production backend.
 * The app will attempt to connect to localhost first; if that fails,
 * it automatically falls back to the hosted Render URL.
 * 
 * DEVELOPMENT:
 * - Update LOCAL_IP with your computer's IP address
 * - Find your IP: Run "ipconfig" (Windows) or "ifconfig" (Mac/Linux)
 * 
 * PRODUCTION:
 * - The hosted URL is always available as fallback
 * - Set FORCE_PRODUCTION = true to skip local attempts entirely
 */

// ==================== CONFIGURATION ====================

// Set to true to ALWAYS use hosted backend (skip local)
const FORCE_PRODUCTION = false;

// Your local computer's IP address (update when it changes)
const LOCAL_IP = '192.168.1.3';
const LOCAL_PORT = '5000';

// Your hosted backend URL
const PRODUCTION_URL = 'https://android-1ej6.onrender.com/api';

// ==================== DO NOT EDIT BELOW ====================

const API_ENDPOINT = '/api';
const LOCAL_URL = `http://${LOCAL_IP}:${LOCAL_PORT}${API_ENDPOINT}`;

// Track which backend we're currently using
let currentBaseUrl = FORCE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;
let isUsingProduction = FORCE_PRODUCTION;

export const API_CONFIG = {
    get BASE_URL() {
        return currentBaseUrl;
    },

    IS_PRODUCTION: FORCE_PRODUCTION,
    LOCAL_IP,
    LOCAL_URL,
    PRODUCTION_URL,

    // Switch to production URL (called on local connection failure)
    switchToProduction: () => {
        if (!isUsingProduction) {
            console.log('⚡ Switching to hosted backend:', PRODUCTION_URL);
            currentBaseUrl = PRODUCTION_URL;
            isUsingProduction = true;
        }
    },

    // Switch back to local URL (for retry)
    switchToLocal: () => {
        if (isUsingProduction && !FORCE_PRODUCTION) {
            console.log('⚡ Switching back to local backend:', LOCAL_URL);
            currentBaseUrl = LOCAL_URL;
            isUsingProduction = false;
        }
    },

    // Check if currently using production
    isProduction: () => isUsingProduction,

    // Helper to get the current environment
    getEnvironment: () => isUsingProduction ? 'production' : 'development',

    // Helper to log current configuration
    logConfig: () => {
        console.log('=== API Configuration ===');
        console.log('Environment:', isUsingProduction ? 'PRODUCTION (Hosted)' : 'DEVELOPMENT (Local)');
        console.log('Base URL:', currentBaseUrl);
        console.log('Local URL:', LOCAL_URL);
        console.log('Production URL:', PRODUCTION_URL);
        console.log('========================');
    }
};

// Log configuration on app start
console.log('🔗 API Config:', {
    environment: API_CONFIG.getEnvironment(),
    baseUrl: API_CONFIG.BASE_URL,
    localUrl: LOCAL_URL,
    productionUrl: PRODUCTION_URL
});
