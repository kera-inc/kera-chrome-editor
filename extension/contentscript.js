function init(chrome, editor) {
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (!editor) {
      editor = require('bay');
    }

    if (request.method == 'activate') {
      editor.show();

      if (request.logged_in == true) {
        editor.login(request.apiKey);
      }
    }

    if (request.method == 'deactivate') {
      editor.hide();
    }

    editor.on('requestLogin', function() {
      chrome.extension.sendMessage('requestLogin', function(apiKey) {
        editor.login(apiKey);
      });
    });

    editor.on('logout', function() {
      chrome.extension.sendMessage('logout');
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
} else {
  init(chrome);
}
