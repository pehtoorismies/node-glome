
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

// private functions
function addHeaders(response, body) {
  var gid,
      x_csrf_token,
      auth_token,
      auth_token_exp;

  try  {
    gid = JSON.parse(body).glomeid;
  } catch (error) {
    console.error("Error parsing response");
    return {};
  }


  if (typeof(response.getAllResponseHeaders) === 'function') {
    x_csrf_token   = response.getResponseHeader('x-csrf-token');
    auth_token     = response.getResponseHeader('token');
    auth_token_exp = response.getResponseHeader('token-exp');

  } else if (response.hasOwnProperty('headers')) {
    x_csrf_token   = response.headers['x-csrf-token'];
    auth_token     = response.headers['token'];
    auth_token_exp = response.headers['token-exp'];
  }

  var result = { glomeId :gid };

  if (x_csrf_token) {
    result.x_csrf_token = x_csrf_token;
  }
  if (auth_token) {
    result.auth_token = auth_token;
  }
  if (auth_token_exp) {
    result.auth_token_exp = auth_token_exp;
  }

  return result;
}

// end private functions


var request = require('request'),
    Promise = require('es6-promise').Promise,
    config = {
      "server"     : DEFAULTS.get('SERVER'),
      "url_create" : DEFAULTS.get('URL_CREATE'),
      "url_login"  : DEFAULTS.get('URL_LOGIN')
    };

function glomeRequest(options) {

  var opts = {
      url: options.url,
      method: options.method,
      headers: options.headers,
      form: options.form,
      withCredentials: false,
      verbose: false
  }

  return new Promise(function(resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode == options.successStatusCode) {
        try {
          var result = options.parseResults(response, body);
          result ? resolve(result) : reject("Server error");

        } catch (e) {
          console.error(e);
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

// Create id
createId = function(appId) {
  var options = {};

  options.url = config["server"].concat(config["url_create"]);

  if (appId) {
    options.form = { 'application[apikey]': appId['apiKey'],
                     'application[uid]': appId['uid'] };
  }

  options.method = 'POST';
  options.successStatusCode = 201;
  options.parseResults = function(response, body) {
    var result = JSON.parse(body);
    return result.glomeid ? result : null;
  };
  return glomeRequest(options);
}

login = function(glomeid) {
  var options = {};

  options.url = config["server"].concat(config["url_login"]);
  options.method = 'POST';
  options.form = {'user[glomeid]' : glomeid };
  options.successStatusCode = 200;

  options.parseResults = function(response, body) {
    result = addHeaders(response,body);
    console.log("RESULT:::::::::");
    console.log(result);
    return result.glomeId ? result : null;

  };
  return glomeRequest(options);
}

createSync = function(glomeid, csrf) {
  var options = {};

  options.url = config["server"].concat('/users/',glomeid,'/sync.json');
  options.method = 'POST';
  options.headers = { 'X-CSRF-Token'  : csrf };

  options.successStatusCode = 201;

  options.parseResults = function(response, body) {
    var result = JSON.parse(body);
    console.log(result.code);
    return result.code ? result : null;
  };
  return glomeRequest(options);
}

module.exports.createId = createId;
module.exports.login = login;
module.exports.getIdFromStorage = getIdFromStorage;
module.exports.saveIdToStorage = saveIdToStorage;
module.exports.config = config;
module.exports.createSync = createSync;