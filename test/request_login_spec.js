describe('RequestLogin', function() {
  var sinon = require('sinon');
  var expect = require('expect.js');
  var init = require('../extension/request_login.js');

  // ACTIONS
  function loadPopup(activeWindow, requestLoginCallback) {
    requestLogin(requestLoginCallback);
    chrome.windows.getCurrent.getCall(0).args[0](activeWindow);
    var args = chrome.windows.create.getCall(0).args;
    var popupDetails = args[0];
    var popupCallback = args[1];
    popupCallback('popup-stub');

    return popupDetails;
  }

  function reloadEnvironment() {
    requestLogin = init(chrome, onLogin, ENV);
  }

  // STUBBING VARIABLES
  var chrome
    , requestLogin
    , onLogin
    , ENV;

  beforeEach(function() {
    chrome = {
      windows: {
        getCurrent: sinon.spy(),
        create: sinon.spy()
      }
    }

    onLogin = sinon.spy();

    ENV = {
      CHROME_ENV: 'development'
    }

    reloadEnvironment();
  });

  describe('when the login window appears in production', function() {
    var popupDetails;

    beforeEach(function() {
      ENV.CHROME_ENV = 'production';
      reloadEnvironment();
      popupDetails = loadPopup({ width: 1000, height: 1000 }, function() {});
    });

    it('visits the production kera chrome auth page', function() {
      expect(popupDetails.url).to.equal('https://www.kera.io/auth/chrome');
    });
  });

  describe('when the login window appears', function() {
    var popupDetails
      , activeWindow
      , requestLoginCallback;

    beforeEach(function() {
      activeWindow = {
        width: 1000,
        height: 1000
      };

      requestLoginCallback = sinon.spy();
      popupDetails = loadPopup(activeWindow, requestLoginCallback);
    });

    it('visits the kera chrome auth page', function() {
      expect(popupDetails.url).to.equal('http://localhost:5000/auth/chrome');
    });

    it('positions in the center of the current window', function() {
      expect(popupDetails.left).to.equal( (activeWindow.width / 2) - (popupDetails.width / 2) );
      expect(popupDetails.top).to.equal( (activeWindow.height / 2) - (popupDetails.height / 2) );
    });

    it('is a popup type', function() {
      expect(popupDetails.type).to.equal('popup');
    });

    it('calls onLogin with the popup and the original callback', function() {
      expect(onLogin.calledWith('popup-stub', requestLoginCallback)).to.equal(true);
    });
  });
});
