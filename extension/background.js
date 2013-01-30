function init(chrome, XMLHttpRequest) {
  var keraActive = {}
    , ANGULAR_URL = 'http://ajax.googleapis.com/ajax/libs/angularjs/1.0.4/angular.min.js'
    , BAY_LIB_URL = 'http://localhost:5999/bay.js'
    , BAY_CSS_URL = 'http://localhost:5999/bay.css'
    , bayCss
    , bayLib
    , angularLib
    , scriptsLoaded = false
    , scriptsLoadedCallbacks = [];

  get(ANGULAR_URL, function(angular) {
    angularLib = angular;

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

    chrome.tabs.executeScript(tabId, { code: angularLib + bayLib  }, function() {
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
