const logger = {
  info: (message) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`);
  },
  
  error: (message, error = '') => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  },
  
  warn: (message) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`);
  },
  
  debug: (message, data = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, data);
    }
  }
};

module.exports = logger;