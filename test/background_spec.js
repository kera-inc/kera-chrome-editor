describe('Background', function() {
  var sinon = require('sinon');
  var expect = require('expect.js');
  var background = require('../extension/background.js');

  // EXPECTATIONS
  function expectActive(tabId) {
    expect(chrome.pageAction.setIcon.calledWith({ tabId: tabId, path: 'active.png' })).to.equal(true);
  }

  function expectDeactive(tabId) {
    expect(chrome.pageAction.setIcon.calledWith({ tabId: tabId, path: 'deactive.png' })).to.equal(true);
    expect(chrome.tabs.sendMessage.calledWith(tabId, { method: 'deactivate', CHROME_ENV: ENV.CHROME_ENV })).to.equal(true);
  }

  function expectLoggedInMessage(tabId, loggedIn, apiKey) {
    expect(chrome.tabs.sendMessage.calledWith(tabId, { method: 'activate', logged_in: loggedIn, apiKey: apiKey, CHROME_ENV: ENV.CHROME_ENV })).to.equal(true);
  }

  // ACTIONS
  function updateTab(tabId) {
    chrome.pageAction.setIcon = sinon.spy();
    chrome.pageAction.show = sinon.spy();
    chrome.tabs.sendMessage = sinon.spy();
    chrome.tabs.executeScript = function(id, details, callback) {
      expect(id).to.equal(tabId);
      expect(details.code).to.equal(angularLib + angularResourceLib + bayLib);
      callback();
    }

    chrome.tabs.insertCSS = function(id, details) {
      expect(id).to.equal(tabId);
      expect(details.code).to.equal(bayCss);
    }

    onUpdatedAddListenerCallback(tabId, { status: 'complete' });
  }

  function clickPageAction(tabId) {
    chrome.pageAction.setIcon = sinon.spy();
    chrome.tabs.sendMessage = sinon.spy();

    addEventListenerCallback({ id: tabId });
  }

  function login(apiKey) {
    loggedInKey = apiKey;
  }

  function contentSends(message, callback) {
    if (chrome.extension.onMessage.addListener.called == false)
      return;

    var call = chrome.extension.onMessage.addListener.getCall(0);
    var messageCb = call.args[0];
    messageCb(message, 'sender', callback || function(){});
  }

  function librariesLoaded() {
    xhrInstances[0].responseText = angularLib;
    xhrInstances[0].readyState = 4;
    xhrInstances[0].onreadystatechange();

    xhrInstances[1].responseText = angularResourceLib;
    xhrInstances[1].readyState = 4;
    xhrInstances[1].onreadystatechange();

    xhrInstances[2].responseText = bayLib;
    xhrInstances[2].readyState = 4;
    xhrInstances[2].onreadystatechange();

    xhrInstances[3].responseText = bayCss;
    xhrInstances[3].readyState = 4;
    xhrInstances[3].onreadystatechange();
  }

  function reloadEnvironment() {
    xhrInstances = [];
    background(chrome, xhr, requestLogin, ENV, require('async'));
  }

  // STUBBING VARIABLES
  var chrome
    , addEventListenerCallback
    , onUpdatedAddListenerCallback
    , extensionOnMessageAddListenerCallback
    , loggedIn
    , loggedInKey;

  var xhr
    , xhrInstances
    , angularLib = 'angular'
    , angularResourceLib = 'angular-resource'
    , bayLib = 'library'
    , bayCss = 'stylesheet';

  var requestLogin
    , requestLoginCallback;

  var ENV;

  beforeEach(function() {
    loggedInKey = undefined;

    chrome = {
      tabs: {
        onUpdated: {
          addListener: function(callback) {
            onUpdatedAddListenerCallback = callback;
          }
        }
      },

      extension: {
        onMessage: {
          addListener: sinon.spy()
        }
      },

      pageAction: {
        onClicked: {
          addListener: function(callback) {
            addEventListenerCallback = callback;
          }
        }
      },

      storage: {
        sync: {
          get: function(key, callback) {
            var results = {};
            results[key] = loggedInKey;
            callback(results);
          },

          set: sinon.spy(),
          remove: sinon.spy()
        }
      }
    }

    xhr = function() {}
    xhrInstances = [];

    xhr.prototype = {
      open: function(method, url, async) {
        this.url = url;
        expect(method).to.equal('GET');
        expect(async).to.equal(true);
      },
      send: function() {
        xhrInstances.push(this);
      }
    }

    requestLogin = sinon.spy();

    ENV = {
      CHROME_ENV: 'development'
    }

    reloadEnvironment();
  });

  describe('xhr has loaded the library', function() {
    beforeEach(function() {
      librariesLoaded();
    });

    it('uses the proper xhr urls', function() {
      expect(xhrInstances[0].url).to.equal('http://localhost:5999/javascripts/angular.min.js');
      expect(xhrInstances[1].url).to.equal('http://localhost:5999/javascripts/angular-resource.js');
      expect(xhrInstances[2].url).to.equal('http://localhost:5999/bay.js');
      expect(xhrInstances[3].url).to.equal('http://localhost:5999/bay.css');
    });

    describe('tab updating', function() {
      describe('when a tab is updated and kera is deactive', function() {
        var tabId;

        beforeEach(function() {
          tabId = 1;
          updateTab(tabId);
        });

        it('shows the pageAction', function() {
          expect(chrome.pageAction.show.calledWith(tabId)).to.equal(true);
        });

        it('sets the tab to deactive', function() {
          expectDeactive(tabId);
        });

        describe('when the pageAction is clicked and the page is updated', function() {
          beforeEach(function() {
            clickPageAction(tabId);
            updateTab(tabId);
          });

          it('sets the tab to active', function() {
            expectActive(tabId);
          });
        });
      });
    });

    describe('pageAction toggle', function() {
      describe('when the deactive pageAction is clicked', function() {
        var tabId, apiKey;

        beforeEach(function() {
          tabId = 1;
          apiKey = 'abc123';
        });

        describe('while logged in', function() {
          beforeEach(function() {
            login(apiKey);
            clickPageAction(tabId);
          });

          it('should be active', function() {
            expectActive(tabId);
          });

          it('should send a logged in message with apiKey', function() {
            expectLoggedInMessage(tabId, true, apiKey);
          });

          describe('when the pageAction is clicked second time', function() {
            beforeEach(function() {
              clickPageAction(tabId);
            });

            it('should be deactive', function() {
              expectDeactive(tabId);
            });
          });
        });

        describe('while logged out', function() {
          beforeEach(function() {
            clickPageAction(tabId);
          });

          it('should be active', function() {
            expectActive(tabId);
          });

          it('should not send a logged in message', function() {
            expectLoggedInMessage(tabId, false);
          });
        });
      });
    });

    describe('when the contentScript sends "requestLogin"', function() {
      var sendResponseResults
        , apiKey;

      beforeEach(function() {
        apiKey = 'abc123';

        contentSends('requestLogin', function(result) {
          sendResponseResults = result;
        });
      });

      it('should requestLogin from the user', function() {
        expect(requestLogin.called).to.equal(true);
      });

      describe('when requestLogin returns the apiKey', function() {
        beforeEach(function() {
          requestLogin.getCall(0).args[0](apiKey);
        });

        it('calls sendResponse on the contentScript listenter passing the api key', function() {
          expect(sendResponseResults).to.equal(apiKey);
        });

        it('stores the api key in sync storage', function() {
          expect(chrome.storage.sync.set.calledWith({ 'apiKey': apiKey })).to.equal(true);
        });
      });
    });

    describe('when the contentscript sends "logout"', function() {
      beforeEach(function() {
        contentSends('logout');
      });

      it('removes the api key from sync storage', function() {
        expect(chrome.storage.sync.remove.calledWith('apiKey')).to.equal(true);
      });
    });
  });
});
