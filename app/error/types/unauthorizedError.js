'use strict';

/**
 * Module dependencies
 */
let ClientError = require('app/error/types/clientError');

/**
 * Error constructor
 */
function UnauthorizedError(code, message, data) {
  ClientError.call(this, code || 'NOT_AUTHORIZED', message, data, 403);
}

/**
 * Extend client error
 */
UnauthorizedError.prototype = Object.create(ClientError.prototype);
UnauthorizedError.prototype.constructor = UnauthorizedError;
UnauthorizedError.prototype.name = 'UnauthorizedError';

/**
 * Module export
 */
module.exports = UnauthorizedError;
