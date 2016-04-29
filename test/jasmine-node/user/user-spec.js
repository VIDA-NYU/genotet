var fs = require('fs');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

/** @const */
var userSpec = {};

/** @private {!Array<string>} */
userSpec.cookie_ = [];

/**
 * Test cases for user signup, login, logout.
 * @type {!Array<{
 *   name: string,
 *   action: function(!frisby),
 *   check: Function
 * }>}
 */
userSpec.tests = [
  {
    name: 'signup user',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'sign-up',
          username: 'testuser',
          password: 'testuser',
          email: 'testuser@genotet.org'
        })
        .expectStatus(200);
    },
    check: function(data) {
      it('return username', function() {
        expect(data.username).toBe('testuser');
      });

      // Record signup cookie.
      userSpec.cookie_ = server.getCookieSessionId(server.cookie);

      // Important! Write server.cookie down so that it can be used by other
      // jasmine-node tests.
      fs.writeFileSync('dist/session', JSON.stringify(server.cookie));
    }
  },
  {
    name: 'logout user',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'log-out'
        })
        .expectStatus(200);
    },
    check: function(data) {
      it('return empty object', function() {
        expect(data).toEqual({});
      });
      it('cookie does not change', function() {
        expect(userSpec.cookie_).toEqual(
          server.getCookieSessionId(server.cookie));
      });
    }
  },
  {
    name: 'login user',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'sign-in',
          username: 'testuser',
          password: 'testuser'
        })
        .expectStatus(200);
    },
    check: function(data) {
      it('return username', function() {
        expect(data.username).toBe('testuser');
      });
      it('return sessionId', function() {
        expect(data.sessionId).toEqual(jasmine.any(String));
      });
      it('cookie does not change', function() {
        expect(userSpec.cookie_).toEqual(
          server.getCookieSessionId(server.cookie));
      });
    }
  },
  {
    name: 'double login user',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'sign-in',
          username: 'testuser',
          password: 'testuser'
        })
        .expectStatus(200);
    },
    check: function(data) {
      it('return username', function() {
        expect(data.username).toBe('testuser');
      });
      it('return sessionId', function() {
        expect(data.sessionId).toEqual(jasmine.any(String));
      });
      it('cookie does not change', function() {
        expect(userSpec.cookie_).toEqual(
          server.getCookieSessionId(server.cookie));
      });
    }
  },
  {
    name: 'auto signin user',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'auto-sign-in'
        })
        .expectStatus(200);
    },
    check: function(data) {
      it('return username', function() {
        expect(data.username).toBe('testuser');
      });
      it('cookie does not change', function() {
        expect(userSpec.cookie_).toEqual(
          server.getCookieSessionId(server.cookie));
      });
    }
  }
];
chain.test(userSpec.tests);
