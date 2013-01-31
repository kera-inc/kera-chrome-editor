function init(chrome, onLogin) {
  function requestLogin(callback) {
    createPopup(function(popup) {
      onLogin(popup, callback);
    });
  }

  function createPopup(callback) {
    chrome.windows.getCurrent(function(activeWindow) {
      chrome.windows.create(getPopupDetails(activeWindow), callback);
    });
  }

  function getPopupDetails(activeWindow) {
    var popupWidth  = 500
    , popupHeight = 300
    , url = 'http://localhost:5000/auth/bay'
    , left = (activeWindow.width / 2) - (popupWidth / 2)
    , top  = (activeWindow.height / 2) - (popupHeight / 2);

    return {
      url: url,
      left: left,
      top: top,
      width: popupWidth,
      height: popupHeight,
      type: 'popup'
    }
  }

  return requestLogin;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
} else {
  window.requestLogin = init(chrome, onLogin);
}
