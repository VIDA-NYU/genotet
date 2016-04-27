QUnit.module('user');

QUnit.test('login', function(assert) {
  genotet.qunit.init();

  assert.expect(1);
  genotet.qunit.chain(assert, [
    {
      action: function() {
        genotet.user.login('testuser', 'testuser', this.next);
      },
      next: true,
      check: function() {
        var username = $('.navbar-fixed-top #username').text();
        assert.equal(username, 'testuser', 'show logged-in username');
      }
    }
  ]);
});
