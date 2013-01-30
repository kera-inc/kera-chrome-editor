function init(chrome) {
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    var editor = require('bay');

    if (request.method == 'activate') {
      editor.show();
    }

    if (request.method == 'deactivate') {
      editor.hide();
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
} else {
  init(chrome);
}
