describe('ContentScript', function() {
  var sinon = require('sinon')
    , expect = require('expect.js')
    , contentscript = require('../extension/contentscript.js')
    , bay = require('bay');

  var chrome
    , onMessageAddListenerCallback;

  function requestMethod(method) {
    onMessageAddListenerCallback({ method: method });
  }

  beforeEach(function() {
    chrome = {
      extension: {
        onMessage: {
          addListener: function(callback) {
            onMessageAddListenerCallback = callback;
          }
        }
      }
    }

    contentscript(chrome);
  });

  describe('when activated', function() {
    beforeEach(function() {
      bay.show = sinon.spy();
      requestMethod('activate');
    });

    it('calls editor.show', function() {
      expect(bay.show.called).to.equal(true);
    });
  });

  describe('when deactivated', function() {
    beforeEach(function() {
      bay.hide = sinon.spy();
      requestMethod('deactivate');
    });

    it('calls editor.hide', function() {
      expect(bay.hide.called).to.equal(true);
    });
  });
});
