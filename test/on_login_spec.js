describe('OnLogin', function() {
  var sinon = require('sinon');
  var expect = require('expect.js');
  var init = require('../extension/on_login.js');

  // STUBBING VARS
  var chrome
    , onLogin

  beforeEach(function() {
    chrome = {
      tabs: {
        onUpdated: {
          addListener: sinon.spy()
        },

        executeScript: sinon.spy()
      },
      windows: {
        remove: sinon.spy()
      }
    }

    onLogin = init(chrome);
  });

  function updateTab(tabId, callback) {
    onLogin({ id: 'popup-id', tabs: [{ id: tabId}] }, callback);
    chrome.tabs.onUpdated.addListener.getCall(0).args[0](tabId);
  }

  describe('when the popup tab is updated', function() {
    var onLoginCallback, popupTabId;

    beforeEach(function() {
      popupTabId = 1;
      onLoginCallback = sinon.spy();

      updateTab(popupTabId, onLoginCallback);
    });

    describe('and the kera-api-key is on the body', function() {
      var apiKey, script, tabId;

      beforeEach(function() {
        apiKey = 'abc123';

        var args = chrome.tabs.executeScript.getCall(0).args;

        tabId = args[0];
        script = args[1].code;

        var cb = args[2]([apiKey]);
      });

      it('checks the popup tab', function() {
        expect(tabId).to.equal(popupTabId);
      });

      it('checks the body for the api key', function() {
        expect(script).to.equal('document.body.getAttribute("kera-api-key")');
      });

      it('calls the callback passing in the api key', function() {
        expect(onLoginCallback.calledWith(apiKey)).to.equal(true);
      });

      it('removes the popup', function() {
        expect(chrome.windows.remove.calledWith('popup-id')).to.equal(true);
      });
    });
  });
});
