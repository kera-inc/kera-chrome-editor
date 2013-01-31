describe('ContentScript', function() {
  var sinon = require('sinon')
    , expect = require('expect.js')
    , contentscript = require('../extension/contentscript.js');

  var editor;

  var chrome
    , onMessageAddListenerCallback;

  function requestMethod(method, environment, apiKey) {
    var loggedIn = (apiKey) ? true : false;

    onMessageAddListenerCallback({ method: method, CHROME_ENV: environment, logged_in: loggedIn, apiKey: apiKey });
  }

  function editorDispatches(eventName) {
    editor.on.args.forEach(function(arg) {
      if (arg[0] == eventName) {
        arg[1]();
      }
    });
  }

  function expectBackgroundMessage(eventName) {
    var messageFound = false;

    chrome.extension.sendMessage.args.forEach(function(arg) {
      if (arg[0] == eventName) {
        messageFound = true;
      }
    });

    expect(messageFound).to.equal(true);
  }

  function backgroundResponds(eventName, results) {
    chrome.extension.sendMessage.args.forEach(function(arg) {
      if (arg[0] == eventName) {
        arg[1](results);
      }
    });
  }

  beforeEach(function() {
    editor = {
      on: sinon.spy(),
      show: sinon.spy(),
      login: sinon.spy(),
      hide: sinon.spy()
    };

    chrome = {
      extension: {
        onMessage: {
          addListener: function(callback) {
            onMessageAddListenerCallback = callback;
          }
        },

        sendMessage: sinon.spy()
      }
    }

    contentscript(chrome, editor);
  });

  describe('when activated and logged in', function() {
    var apiKey = 'abc123';
    beforeEach(function() {
      requestMethod('activate', 'development', apiKey);
    });

    it('calls editor.show', function() {
      expect(editor.show.calledWith('development')).to.equal(true);
    });

    it('calls editor.login and passes in apiKey', function() {
      expect(editor.login.calledWith(apiKey)).to.equal(true);
    });
  });

  describe('when activated in production', function() {
    beforeEach(function() {
      requestMethod('activate', 'production');
    });

    it('calls editor.show with production', function() {
      expect(editor.show.calledWith('production')).to.equal(true);
    });
  });

  describe('when activated and not logged in', function() {
    beforeEach(function() {
      requestMethod('activate');
    });

    it('calls editor.show', function() {
      expect(editor.show.called).to.equal(true);
    });

    it('does not call editor.login', function() {
      expect(editor.login.called).to.equal(false);
    });
  });

  describe('when deactivated', function() {
    beforeEach(function() {
      requestMethod('deactivate');
    });

    it('calls editor.hide', function() {
      expect(editor.hide.called).to.equal(true);
    });
  });

  describe('when the editor dispatches "requestLogin"', function() {
    beforeEach(function() {
      requestMethod('activate');
      editorDispatches('requestLogin');
    });

    it('sends "requestLogin" to the background script', function() {
      expectBackgroundMessage('requestLogin');
    });

    describe('when the background script responds with the apiKey', function() {
      beforeEach(function() {
        backgroundResponds('requestLogin', 'apiKey');
      });

      it('calls editor.login and passes in the key', function() {
        expect(editor.login.calledWith('apiKey')).to.equal(true);
      });
    });
  });

  describe('when the editor dispatches "logout"', function() {
    beforeEach(function() {
      requestMethod('activate');
      editorDispatches('logout');
    });

    it('sends "logout" to the background script', function() {
      expectBackgroundMessage('logout');
    });
  });
});
