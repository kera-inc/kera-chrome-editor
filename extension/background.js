function init(chrome, XMLHttpRequest, requestLogin, ENV, async) {
  var rootUrl = "";

  var URLs = {
    rootUrl: '',
    production: 'https://s3.amazonaws.com/kera-store/bay/latest.json',
    development: 'http://localhost:5999/latest.json',

    libs: {
      ANGULAR: '/javascripts/angular.min.js',
      ANGULAR_RESOURCE: '/javascripts/angular-resource.js',
      BAY_LIB: '/build.js',
      BAY_CSS: '/build.css'
    },

    get: function(keyword) {
      if (!this.rootUrl) {
        throw new Error('rootUrl has not been set');
      }

      return this.rootUrl + this.libs[keyword];
    }
  };

  var keraActive = {}
    , angularLib
    , angularResourceLib
    , bayCss
    , bayLib
    , scriptsLoaded = false
    , scriptsLoadedCallbacks = [];

  // MAIN METHOD
  async.series([ getRootUrl, getLibraries, callDeferredScripts ]);

  function getRootUrl(callback) {
    console.log('Starting Kera Editor...');
    console.log('* Getting root url');

    get(URLs[ENV.CHROME_ENV], function(err, latest) {


      if (err) {
        callback(err);
        return;
      }

      /////------ HARD CODED TO THIS VERSION
      if (ENV.CHROME_ENV === 'production') {
        URLs.rootUrl = 'https://s3.amazonaws.com/kera-store/bay/1.1.13.1';
      } else {
        var obj = JSON.parse(latest);
        URLs.rootUrl = obj.url;
      }

      console.log('* Root url found: ' + URLs.rootUrl);
      callback();
    });
  }

  function get(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        callback(null, xhr.responseText);
      }
    }
    xhr.send();
  }

  function getLibraries(callback) {
    console.log('* Loading libraries');
    async.map([URLs.get('ANGULAR'), URLs.get('ANGULAR_RESOURCE'), URLs.get('BAY_LIB'), URLs.get('BAY_CSS')], get, function(err, results) {
      if (err) {
        callback(err);
        return;
      }

      saveLibs(results);

      callback();
    });
  }

  function saveLibs(results) {
    console.log('* Saving libraries');

    angularLib = results[0];
    angularResourceLib = results[1];
    bayLib = results[2];
    bayCss = results[3];
  }

  function callDeferredScripts(callback) {
    console.log('* Libraries saved. Booting injector');
    scriptsLoaded = true;
    scriptsLoadedCallbacks.forEach(function(cb) {
      cb();
    });

    scriptsLoadedCallbacks = [];

    callback();
  }

  chrome.tabs.onUpdated.addListener(function(tabId, details) {
    if (details.status != "complete")
      return;

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
    console.log('Injecting scripts into tab: ' + tabId);

    chrome.tabs.insertCSS(tabId, { code: bayCss });

    chrome.tabs.executeScript(tabId, { code: angularLib + angularResourceLib + bayLib  }, function() {
      callback();
    });
  }

  function deactivate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'deactive.png' });
    chrome.tabs.sendMessage(tabId, { method: 'deactivate', CHROME_ENV: ENV.CHROME_ENV });
  }

  function activate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'active.png' });

    chrome.storage.sync.get('apiKey', function(results) {
      var logged_in = (results.apiKey) ? true : false;
      chrome.tabs.sendMessage(tabId, { method: 'activate', logged_in: logged_in, apiKey: results.apiKey, CHROME_ENV: ENV.CHROME_ENV });
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
  init(chrome, XMLHttpRequest, requestLogin, ENV, async);
}
