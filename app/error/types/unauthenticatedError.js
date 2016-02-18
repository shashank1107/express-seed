'use strict';

/**
 * Dependencies
 */
let ClientError = require('app/error/types/clientError');

/**
 * Error constructor
 */
function UnauthenticatedError(code, message, data) {
  ClientError.call(this, code || 'NOT_AUTHENTICATED', message, data, 401);
}

/**
 * Extend client error
 */
UnauthenticatedError.prototype = Object.create(ClientError.prototype);
UnauthenticatedError.prototype.constructor = UnauthenticatedError;
UnauthenticatedError.prototype.name = 'UnauthenticatedError';

/**
 * Module export
 */
module.exports = UnauthenticatedError;
