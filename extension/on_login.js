function init(chrome) {
  function onLogin(popup, callback) {
    var popupTabId = popup.tabs[0].id;

    chrome.tabs.onUpdated.addListener(function(tabId) {
      if (popupTabId == tabId) {
        chrome.tabs.executeScript(tabId, { code: 'document.body.getAttribute("kera-api-key") + ":::" + document.body.getAttribute("kera-app-id")' }, function(results) {
          if (results && results[0]) {
            var apiKey = results[0];
            callback(apiKey);


            chrome.windows.remove(popup.id);
          }
        });
      }
    });
  }

  return onLogin;
}

if (typeof module != 'undefined' && module.exports) {
  module.exports = init;
} else {
  window.onLogin = init(chrome);
}
