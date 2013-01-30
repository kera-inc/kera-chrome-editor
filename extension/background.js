function init(chrome, XMLHttpRequest) {
  var keraActive = {}

  var BAY_LIB_URL = 'http://localhost:5999/bay.js';
  var BAY_CSS_URL = 'http://localhost:5999/bay.css';
  var bayCss;
  var bayLib;
  var scriptsLoaded = false;
  var scriptsLoadedCallbacks = [];


  get(BAY_LIB_URL, function(js) {
    bayLib = js;

    get(BAY_CSS_URL, function(css) {
      bayCss = css;

      scriptsLoaded = true;
      scriptsLoadedCallbacks.forEach(function(callback) {
        callback();
      });
    });
  });

  function get(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        callback(xhr.responseText);
      }
    }
    xhr.send();
  }

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
    chrome.tabs.insertCSS(tabId, { code: bayCss });

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

  chrome.tabs.onUpdated.addListener(function(tabId, details) {
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
