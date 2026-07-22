const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logFile = path.join(process.cwd(), 'app.log');
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  error(message, error, meta = {}) {
    this.log('ERROR', message, { ...meta, error: error.message, stack: error.stack });
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
    
    console.log(`[${level}] ${message}`, Object.keys(meta).length ? meta : '');
    
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
}

const logger = new Logger();
module.exports = { logger };
