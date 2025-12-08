const NodeCache = require('node-cache');

// Initialize cache with 5-minute TTL (Time To Live)
const cache = new NodeCache({
    stdTTL: 300, // 5 minutes in seconds
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false, // Better performance, but be careful with object mutations
    deleteOnExpire: true
});

// Cache statistics
let cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
};

/**
 * Middleware to cache GET requests
 * @param {number} duration - Cache duration in seconds (optional, defaults to 300)
 */
const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key from URL and user ID (if authenticated)
        const userId = req.user?.id || req.user?._id || 'anonymous';
        const cacheKey = `${req.originalUrl}_${userId}`;

        // Try to get cached response
        const cachedResponse = cache.get(cacheKey);

        if (cachedResponse) {
            cacheStats.hits++;
            // Add cache hit header
            res.set('X-Cache', 'HIT');
            res.set('X-Cache-Key', cacheKey);
            return res.json(cachedResponse);
        }

        // Cache miss - continue to route handler
        cacheStats.misses++;
        res.set('X-Cache', 'MISS');

        // Store original res.json function
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = (body) => {
            // Only cache successful responses
            if (res.statusCode === 200 && body) {
                cache.set(cacheKey, body, duration);
                cacheStats.sets++;
            }
            return originalJson(body);
        };

        next();
    };
};

/**
 * Clear cache for specific pattern
 * @param {string} pattern - Pattern to match cache keys (e.g., '/api/students')
 */
const clearCache = (pattern) => {
    const keys = cache.keys();
    let deletedCount = 0;

    keys.forEach(key => {
        if (key.includes(pattern)) {
            cache.del(key);
            deletedCount++;
        }
    });

    cacheStats.deletes += deletedCount;
    return deletedCount;
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
    const keyCount = cache.keys().length;
    cache.flushAll();
    cacheStats.deletes += keyCount;
    return keyCount;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
    const hitRate = cacheStats.hits + cacheStats.misses > 0
        ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2)
        : 0;

    return {
        ...cacheStats,
        hitRate: `${hitRate}%`,
        currentKeys: cache.keys().length,
        cacheSize: cache.getStats()
    };
};

/**
 * Middleware to invalidate cache on data modifications
 * Use this on POST, PUT, PATCH, DELETE routes
 */
const invalidateCacheMiddleware = (pattern) => {
    return (req, res, next) => {
        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override to clear cache after successful response
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                clearCache(pattern || req.baseUrl || req.path);
            }
            return originalJson(body);
        };

        next();
    };
};

module.exports = {
    cacheMiddleware,
    clearCache,
    clearAllCache,
    getCacheStats,
    invalidateCacheMiddleware,
    cache
};
