var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

/** @const */
var badSignUpSpec = {};

/**
 * Test cases for bad signup requests.
 * @type {!Array<{
 *   name: string,
 *   action: function(!frisby),
 *   check: Function
 * }>}
 */
badSignUpSpec.tests = [
  {
    name: 'invalid username',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'sign-up',
          username: 'hello world',
          password: 'helloworld',
          email: 'helloworld@gmail.com'
        })
        .expectStatus(500);
    },
    check: function(data) {
      it('invalid username error', function() {
        expect(data).toBe('invalid username');
      });
    }
  },
  {
    name: 'password too short',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'sign-up',
          username: 'helloworld',
          password: 'hello',
          email: 'helloworld@gmail.com'
        })
        .expectStatus(500);
    },
    check: function(data) {
      it('invalid password error', function() {
        expect(data).toBe('invalid password');
      });
    }
  },
  {
    name: 'invalid email 1',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'sign-up',
          username: 'helloworld',
          password: 'helloworld',
          email: 'helloworld'
        })
        .expectStatus(500);
    },
    check: function(data) {
      it('invalid email error', function() {
        expect(data).toBe('invalid email');
      });
    }
  },
  {
    name: 'invalid email 2',
    action: function(frisby) {
      server
        .post(frisby, server.userUrl, {
          type: 'sign-up',
          username: 'helloworld',
          password: 'helloworld',
          email: 'helloworld@gmail'
        })
        .expectStatus(500);
    },
    check: function(data) {
      it('invalid email error', function() {
        expect(data).toBe('invalid email');
      });
    }
  }
];
chain.test(badSignUpSpec.tests);
