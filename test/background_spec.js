describe('Background', function() {
  var sinon = require('sinon');
  var expect = require('expect.js');
  var background = require('../extension/background.js');

  // stubbing variables
  var chrome
    , addEventListenerCallback
    , onUpdatedAddListenerCallback;

  beforeEach(function() {
    chrome = {
      tabs: {
        onUpdated: {
          addListener: function(callback) {
            onUpdatedAddListenerCallback = callback;
          }
        }
      },
      pageAction: {
        onClicked: {
          addListener: function(callback) {
            addEventListenerCallback = callback;
          }
        }
      }
    }

    background(chrome);
  });

  function expectActive(tabId) {
    expect(chrome.pageAction.setIcon.calledWith({ tabId: tabId, path: 'active.png' })).to.equal(true);
    expect(chrome.tabs.sendMessage.calledWith(tabId, { method: 'activate' })).to.equal(true);
  }

  function expectDeactive(tabId) {
    expect(chrome.pageAction.setIcon.calledWith({ tabId: tabId, path: 'deactive.png' })).to.equal(true);
    expect(chrome.tabs.sendMessage.calledWith(tabId, { method: 'deactivate' })).to.equal(true);
  }

  function updateTab(tabId) {
    chrome.pageAction.setIcon = sinon.spy();
    chrome.pageAction.show = sinon.spy();
    chrome.tabs.sendMessage = sinon.spy();

    onUpdatedAddListenerCallback(tabId);
  }

  function clickPageAction(tabId) {
    chrome.pageAction.setIcon = sinon.spy();
    chrome.tabs.sendMessage = sinon.spy();

    addEventListenerCallback({ id: tabId });
  }

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
      var tabId;

      beforeEach(function() {
        tabId = 1;

        clickPageAction(tabId);
      });

      it('should be active', function() {
        expectActive(tabId);
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
  });
});
