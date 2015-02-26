
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
    Promise = require('es6-promise').Promise,
    config = {
      "server"     : DEFAULTS.get('SERVER'),
      "url_create" : DEFAULTS.get('URL_CREATE'),
      "url_login"  : DEFAULTS.get('URL_LOGIN')
    },
    headers = {
      //'User-Agent'  : 'Super Agent/0.0.1',
      'content-type': 'application/json'
    };

// Create id
createId = function(appId) {
  var url = config["server"].concat(config["url_create"]);
  var form;
  if (appId) {
    form = { 'application[apikey]': appId['apiKey'],
             'application[uid]': appId['uid'] };
  }



  var options = {
      url: url,
      method: 'POST',
      headers: headers,
      form: form,
      withCredentials: false,
      verbose: false
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

getIdFromStorage = function (webLocalStorage, storageId) {
  if (!webLocalStorage) {
    return false;
  }
  var key = storageId || DEFAULTS.get('LOCALSTORAGE_KEY');

  return webLocalStorage.getItem(key);
}

saveIdToStorage = function (glomeid, webLocalStorage, storageId) {
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
      withCredentials: false,
      verbose: false
  }
  return new Promise(function(resolve, reject) {
    // Start the request
    request(options, function (error, response, body) {
      if (response && response.statusCode == 200) {
        try {
          if (typeof(response.getAllResponseHeaders) === 'function') {
            console.log(response.getAllResponseHeaders());
          } else if (response.hasOwnProperty('headers')) {
            console.log(response.headers);
          } else {
            console.error("no response headers");

          }

          
          // console.log(response.headers['x-csrf-token']);
          // console.log("headers[set-cookie]");
          // console.log(response.headers['set-cookie']);


          // response.headers['X-CSRF-Token']
          // Set-Cookie: _session_id=384be03b491fb88a64780c9388f2e0fc; path=/; expires=Wed, 04 Mar 2015 10:26:53 -0000; HttpOnly
          // response.headers['Set-Cookie']
          var result = JSON.parse(body);
          result.glomeid ? resolve(result.glomeid) : reject("Server error");
        } catch (e) {
          console.error("Malformed json or error parsing headers:");
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
module.exports.saveIdToStorage = saveIdToStorage;
module.exports.config = config;