var session = require('electron').session;

module.exports = function OfflineSession(allowed_urls) {
  allowed_urls.unshift("chrome-devtools://");
  var sess = session.fromPartition('offline');
  var filter = { urls: [ "*" ] };
  sess.webRequest.onBeforeRequest(filter, (details, callback) => {
    if (!allowed_urls.some((prefix) => details.url.startsWith(prefix))) {
      console.error("Error: Preventing request for URL " + details.url);
      callback({ cancel: true });
    } else {
      callback({});
    }
  });
  return sess;
};
