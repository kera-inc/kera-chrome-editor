function init(chrome, PRODUCTION_ID) {
  var ENV = {
    PRODUCTION_EXTENSION_ID: PRODUCTION_ID,
    CURRENT_EXTENSION_ID: chrome.i18n.getMessage('@@extension_id')
  };

  if (ENV.PRODUCTION_EXTENSION_ID == ENV.CURRENT_EXTENSION_ID) {
    ENV.CHROME_ENV = 'production';
  } else {
    ENV.CHROME_ENV = 'development';
  }

  return ENV;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
} else {
  window.ENV = init(chrome, PRODUCTION_ID);
}
