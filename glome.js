

var DEFAULTS = (function() {
  var private = {
    'LOCALSTORAGE_KEY' : 'glomeidloc',
    'URL_CREATE'       : "/users.json",
    'URL_LOGIN'        : "/users/login.json",
    'SERVER'           : "https://api.glome.me"
  };
  return {
    get: function(name) { return private[name]; }
  };
})();

var request = require('request'),
    Promise = require('promise'),
    config = {
      "server"     : DEFAULTS.get('SERVER'),
      "url_create" : DEFAULTS.get('URL_CREATE'),
      "url_login"  : DEFAULTS.get('URL_LOGIN')
    },
    headers = {
      'User-Agent'  : 'Super Agent/0.0.1',
      'Content-Type': 'application/json'
    };

// Create id
createId = function(appId) {
  var url = config["server"].concat(config["url_create"]);
  var form = { 'application[apikey]': appId['apiKey'],
               'application[uid]': appId['uid'] };

  var options = {
      url: url,
      method: 'POST',
      headers: headers,
      form: form,
      withCredentials: false
  }

  return new Promise(function(resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 201) {
        try {
          var result = JSON.parse(body);
          result.glomeid ? resolve(result.glomeid) : reject("Server error");

        } catch (e) {
          console.error("Malformed json:");
          console.error(body);
          reject("Server error ");
        }
      } else {
        reject(error);
      }
    });
  });
}

getIdFromStorage = function getIdFromStorage(webLocalStorage, storageId) {
  if (!webLocalStorage) {
    return false;
  }
  var key = storageId || DEFAULTS.get('LOCALSTORAGE_KEY');

  return webLocalStorage.getItem(key);
}

saveToStorage = function saveToStorage(glomeid, webLocalStorage, storageId) {
  if (!webLocalStorage || !glomeid) {
    return false;
  }
  var key = storageId || DEFAULTS.get('LOCALSTORAGE_KEY');
  webLocalStorage.setItem(key, glomeid);
  return webLocalStorage.getItem(key);
}

login = function(glomeid) {
  // Configure the request
  var url = config["server"].concat(config["url_login"]);

  var options = {
      url: url,
      method: 'POST',
      headers: headers,
      form: {'user[glomeid]': glomeid },
      withCredentials: false
  }
  return new Promise(function(resolve, reject) {
    // Start the request
    request(options, function (error, response, body) {
      if (error) {
        reject(error);
      } else if (response && response.statusCode == 200) {
        try {
          console.log("Login");
          var result = JSON.parse(body);
          result.glomeid ? result.glomeid : reject("Server error");
        } catch (e) {
          console.error("Malformed json:");
          console.error(body);
          reject("Server error ");
        }
      } else {
        reject(body);

      }
    });
  });
}

module.exports.createId = createId;
module.exports.login = login;
module.exports.getIdFromStorage = getIdFromStorage;
module.exports.saveToStorage = saveToStorage;
module.exports.config = config;