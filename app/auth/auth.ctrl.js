'use strict';

/**
 * Dependencies
 */
let passport = require('passport');
let moment = require('moment');
let UnauthenticatedError = require('../error/types/unauthenticatedError');
let tokens = require('../shared/services/tokens');
let config = require('../config');

/**
 * Constants
 */
const REFRESH_TOKEN_COOKIE_MAX_AGE = config.REFRESH_TOKEN_COOKIE_MAX_AGE;
const REFRESH_TOKEN_COOKIE_SECURE = config.REFRESH_TOKEN_COOKIE_SECURE;
const SECURE_STATUS_EXPIRATION = config.SECURE_STATUS_EXPIRATION;

/**
 * To camel case
 */
function toCamelCase(str, ucfirst) {
  if (typeof str === 'number') {
    return String(str);
  }
  else if (typeof str !== 'string') {
    return '';
  }
  if ((str = String(str).trim()) === '') {
    return '';
  }
  return str
    .replace(/_+|\-+/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) {
        return '';
      }
      return (index === 0 && !ucfirst) ?
        match.toLowerCase() : match.toUpperCase();
    });
}

/**
 * Auth controller
 */
module.exports = {

  /**
   * Verify authentication
   */
  verify(req, res) {
    res.end();
  },

  /**
   * Forget a user
   */
  forget(req, res) {
    res.clearCookie('refreshToken', {
      secure: REFRESH_TOKEN_COOKIE_SECURE,
      httpOnly: true
    });
    res.end();
  },

  /**
   * Token request handler
   */
  token(req, res, next) {

    //Get grant type and initialize access token
    let grantType = toCamelCase(req.body.grantType);
    let remember = !!req.body.remember;
    let secureStatus = !!req.body.secureStatus;

    /**
     * Callback handler
     */
    function authCallback(error, user) {

      //Check error
      if (error) {
        return next(error);
      }

      //No user found?
      if (!user) {
        let errorCode;
        if (grantType === 'password') {
          errorCode = 'INVALID_CREDENTIALS';
        }
        return next(new UnauthenticatedError(errorCode));
      }

      //User suspended?
      if (user.isSuspended) {
        return next(new UnauthenticatedError('USER_SUSPENDED'));
      }

      //User pending approval?
      if (!user.isApproved) {
        return next(new UnauthenticatedError('USER_PENDING'));
      }

      //Set user in request and get claims
      req.user = user;
      let claims = user.getClaims();

      //Requesting secure status?
      if (secureStatus && grantType === 'password') {
        claims.secureStatus = moment()
          .add(SECURE_STATUS_EXPIRATION, 'seconds')
          .toJSON();
      }

      //Generate access token
      let accessToken = tokens.generate('access', claims);

      //Generate refresh token if we want to be remembered
      if (remember) {
        let refreshToken = tokens.generate('refresh', user.getClaims());
        res.cookie('refreshToken', refreshToken, {
          maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE * 1000, //in ms
          secure: REFRESH_TOKEN_COOKIE_SECURE,
          httpOnly: true
        });
      }

      //Send response
      return res.send({
        accessToken: accessToken
      });
    }

    //Handle specific grant types
    switch (grantType) {
      case 'password':
        passport.authenticate('local', authCallback)(req, res, next);
        break;
      case 'refreshToken':
        passport.authenticate('refresh', authCallback)(req, res, next);
        break;
    }
  }
};
