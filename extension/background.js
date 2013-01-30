function init(chrome, XMLHttpRequest) {
  var keraActive = {}

  var BAY_LIB_URL = 'http://localhost:5999/bay.js';
  var bayLib;
  var scriptsLoaded = false;
  var scriptsLoadedCallbacks = [];

  var xhr = new XMLHttpRequest();
  xhr.open('GET', BAY_LIB_URL, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      bayLib = xhr.responseText;
      scriptsLoaded = true;
      scriptsLoadedCallbacks.forEach(function(callback) {
        callback();
      });
    }
  }

  xhr.send();

  function injectScript(tabId, callback) {
    if (scriptsLoaded) {
      doInject(tabId, callback);
    } else {
      scriptsLoadedCallbacks.push(function() {
        doInject(tabId, callback);
      });
    }
  }

  function doInject(tabId, callback) {
    chrome.tabs.executeScript(tabId, { code: bayLib  }, function() {
      callback();
    });
  }

  function activate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'active.png' });
    chrome.tabs.sendMessage(tabId, { method: 'activate' });
  }

  function deactivate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'deactive.png' });
    chrome.tabs.sendMessage(tabId, { method: 'deactivate' });
  }

  chrome.tabs.onUpdated.addListener(function(tabId) {
    injectScript(tabId, function() {
      chrome.pageAction.show(tabId);

      if (!keraActive[tabId]) {
        deactivate(tabId);
      } else {
        activate(tabId);
      }
    });
  });

  chrome.pageAction.onClicked.addListener(function(event) {
    var tabId = event.id;

    if (!keraActive[tabId]) {
      keraActive[tabId] = true;
      activate(tabId);
    } else {
      keraActive[tabId] = false;
      deactivate(tabId);
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
} else {
  init(chrome, XMLHttpRequest);
}
