describe('Environment', function() {
  var sinon = require('sinon');
  var expect = require('expect.js');
  var init = require('../extension/environment.js');

  var chrome, ENV, productionId;

  beforeEach(function() {
    chrome = {
      i18n: {
      }
    }
  });

  function reloadEnvironment() {
    ENV = init(chrome, productionId);
  }

  describe('when the production id matches the current extension id', function() {
    beforeEach(function() {
      productionId = 'abc123';

      chrome.i18n.getMessage = function(key) {
        expect(key).to.equal('@@extension_id');

        return productionId;
      }

      reloadEnvironment();
    });

    it('sets the CHROME_ENV to production', function() {
      expect(ENV.CHROME_ENV).to.equal('production');
    });
  });

  describe('when the production id does not match the current extension id', function() {
    beforeEach(function() {
      productionId = 'abc123';

      chrome.i18n.getMessage = function(key) {
        return '321cba';
      }

      reloadEnvironment();
    });

    it('sets the CHROME_ENV to development', function() {
      expect(ENV.CHROME_ENV).to.equal('development');
    });
  });
});
