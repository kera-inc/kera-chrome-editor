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
    expect(chrome.tabs.sendMessage.calledWith(tabId, { method: 'deactivate' })).to.equal(true);
  }

  function expectLoggedInMessage(tabId, loggedIn, apiKey) {
    expect(chrome.tabs.sendMessage.calledWith(tabId, { method: 'activate', logged_in: loggedIn, apiKey: apiKey })).to.equal(true);
  }

  // ACTIONS
  function updateTab(tabId) {
    chrome.pageAction.setIcon = sinon.spy();
    chrome.pageAction.show = sinon.spy();
    chrome.tabs.sendMessage = sinon.spy();
    chrome.tabs.executeScript = function(id, details, callback) {
      expect(id).to.equal(tabId);
      expect(details.code).to.equal(angularLib + bayLib);
      callback();
    }

    chrome.tabs.insertCSS = function(id, details) {
      expect(id).to.equal(tabId);
      expect(details.code).to.equal(bayCss);
    }

    onUpdatedAddListenerCallback(tabId);
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

  // STUBBING VARIABLES
  var chrome
    , addEventListenerCallback
    , onUpdatedAddListenerCallback
    , extensionOnMessageAddListenerCallback
    , loggedIn
    , loggedInKey;

  var xhr
    , xhrInstance
    , angularLib = 'angular'
    , bayLib = 'library'
    , bayCss = 'stylesheet';

  var requestLogin
    , requestLoginCallback;


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

    xhr.prototype = {
      open: function(method, url, async) {
        expect(method).to.equal('GET');
        expect(async).to.equal(true);
      },
      send: function() {
        xhrInstance = this;
      }
    }

    requestLogin = sinon.spy();

    background(chrome, xhr, requestLogin);
  });


  describe('xhr has loaded the library', function() {
    beforeEach(function() {
      xhrInstance.responseText = angularLib;
      xhrInstance.readyState = 4;
      xhrInstance.onreadystatechange();

      xhrInstance.responseText = bayLib;
      xhrInstance.readyState = 4;
      xhrInstance.onreadystatechange();

      xhrInstance.responseText = bayCss;
      xhrInstance.readyState = 4;
      xhrInstance.onreadystatechange();
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
