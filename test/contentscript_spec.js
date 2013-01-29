describe('ContentScript', function() {
  var sinon = require('sinon');
  var expect = require('expect.js');
  var contentscript = require('../extension/contentscript.js');

  var chrome
    , onMessageAddListenerCallback;

  it('does stuff', function() {

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
    onMessageAddListenerCallback({ message: 'BOO' }, { tab: { url: 'www.google.com' } }, function() {});
  });
});
