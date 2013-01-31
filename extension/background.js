function init(chrome, XMLHttpRequest, requestLogin, ENV) {

  var URLs = {
    production: {
      BAY_LIB: 'https://www.something.com/bay.js',
      BAY_CSS: 'https://www.something.com/bay.css'
    },

    development: {
      BAY_LIB: 'http://localhost:5999/bay.js',
      BAY_CSS: 'http://localhost:5999/bay.css'
    }
  };

  var keraActive = {}
    , ANGULAR_URL = 'https://ajax.googleapis.com/ajax/libs/angularjs/1.0.4/angular.min.js'
    , BAY_LIB_URL = URLs[ENV.CHROME_ENV].BAY_LIB
    , BAY_CSS_URL = URLs[ENV.CHROME_ENV].BAY_CSS
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

  function deactivate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'deactive.png' });
    chrome.tabs.sendMessage(tabId, { method: 'deactivate' });
  }

  function activate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'active.png' });

    chrome.storage.sync.get('apiKey', function(results) {
      var logged_in = (results.apiKey) ? true : false;
      chrome.tabs.sendMessage(tabId, { method: 'activate', logged_in: logged_in, apiKey: results.apiKey });
    });
  }

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

  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request == 'requestLogin') {
      requestLogin(function(apiKey) {
        chrome.storage.sync.set({'apiKey': apiKey});
        sendResponse(apiKey);
      });
    }

    if (request == 'logout') {
      chrome.storage.sync.remove('apiKey');
    }

    return true;
  });

}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
} else {
  init(chrome, XMLHttpRequest, requestLogin, ENV);
}
