function init(chrome) {
  var keraActive = {}

  chrome.tabs.onUpdated.addListener(function(tabId) {
    chrome.pageAction.show(tabId);

    if (!keraActive[tabId]) {
      deactivate(tabId);
    } else {
      activate(tabId);
    }
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

  function activate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'active.png' });
    chrome.tabs.sendMessage(tabId, { method: 'activate' });
  }

  function deactivate(tabId) {
    chrome.pageAction.setIcon({ tabId: tabId, path: 'deactive.png' });
    chrome.tabs.sendMessage(tabId, { method: 'deactivate' });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
} else {
  init(chrome);
}
