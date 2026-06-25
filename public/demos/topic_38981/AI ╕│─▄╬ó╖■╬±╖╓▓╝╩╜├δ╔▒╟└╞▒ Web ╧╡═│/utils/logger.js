const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFileName() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.log`;
}

function formatMessage(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}\n`;
}

function writeLog(level, message, data = {}) {
  const logMessage = formatMessage(level, message, data);
  
  console.log(logMessage.trim());
  
  const filePath = path.join(LOG_DIR, getLogFileName());
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
}

const logger = {
  info: (message, data) => writeLog('info', message, data),
  warn: (message, data) => writeLog('warn', message, data),
  error: (message, data) => writeLog('error', message, data),
  debug: (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      writeLog('debug', message, data);
    }
  }
};

module.exports = logger;