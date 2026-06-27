const crypto = require('crypto');

function requestIdMiddleware(options = {}) {
    const headerName = options.headerName || 'X-Request-Id';

    return function(req, res, next) {
        const existingId = req.headers[headerName.toLowerCase()];
        const requestId = existingId || generateRequestId();

        req.requestId = requestId;
        res.setHeader(headerName, requestId);

        next();
    };
}

function generateRequestId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `req_${timestamp}_${random}`;
}

module.exports = requestIdMiddleware;
module.exports.generateRequestId = generateRequestId;
