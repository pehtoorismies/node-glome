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
    auth_token     = response.getResponseHeader('x-token');
    auth_token_exp = response.getResponseHeader('x-token-exp');

  } else if (response.hasOwnProperty('headers')) {
    x_csrf_token   = response.headers['x-csrf-token'];
    auth_token     = response.headers['x-token'];
    auth_token_exp = response.headers['x-token-exp'];
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

function verifyNotEmpty(data) {
  var retVal = {};

  if (!data) {
    retVal.pass = true;
    return retVal;
  }
  var keys = Object.keys(data);
  var errStr;
  for (i = 0; i < keys.length; i++) {
    var prop = data[keys[i]];
    if (!prop || prop.length == 0) {
      errStr = "Invalid " + keys[i] + " " + "'" + prop + "'";
      retVal = {
        pass : false,
        reject : Promise.reject(errStr)
      }
      return retVal;
    }

  }

  retVal.pass = true;
  return retVal;
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
          reject("Server error ");
        }
      } else {
        if (error) {
          reject(error);
        } else if (body) {
          reject(body);
        } else {
          reject("unspecified error");
        }
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
  var retVal = verifyNotEmpty({glomeid:glomeid});
  if (!retVal.pass) {
    // console.log(retVal.reject)
    return retVal.reject;
  }

  var options = {};
  options.url = config["server"].concat(config["url_login"]);
  options.method = 'POST';
  options.form = {'user[glomeid]' : glomeid };
  options.successStatusCode = 200;

  options.parseResults = function(response, body) {
    result = addHeaders(response,body);
    return result.glomeId ? result : null;

  };
  return glomeRequest(options);
}

createSync = function(glomeid, csrf) {
  var retVal = verifyNotEmpty({glomeid:glomeid, csrf:csrf});
  if (!retVal.pass) {
    return retVal.reject;
  }

  var options = {};
  options.url = config["server"].concat('/users/',glomeid,'/sync.json');
  options.form = {'synchronization[kind]' : 'b' };
  options.method = 'POST';
  options.headers = { 'X-CSRF-Token'  : csrf };

  options.successStatusCode = 201;

  options.parseResults = function(response, body) {
    var result = JSON.parse(body);
    return result.code ? result : null;
  };
  return glomeRequest(options);
}

pair = function(glomeid, pairCode, token, csrf) {
  var retVal = verifyNotEmpty({glomeid:glomeid, token:token, csrf:csrf});
  if (!retVal.pass) {
    return retVal.reject;
  }

  var options = {},
      code    = {};
  options.url = config["server"].concat('/users/',glomeid,'/sync/pair.json');
  options.method = 'POST';
  options.headers = { 'X-CSRF-Token'    : csrf,
                      'X-Token'         : token };

  if (!pairCode || pairCode.trim().length !== 12) {
    return Promise.reject('Invalid code "' + pairCode + '"');
  }

  pairCode = pairCode.trim();

  code['part_1'] = pairCode.slice(0, 4);
  code['part_2'] = pairCode.slice(4, 8);
  code['part_3'] = pairCode.slice(8, 12);

  options.form = { 'pairing[code_1]': code['part_1'],
                   'pairing[code_2]': code['part_2'],
                   'pairing[code_3]': code['part_3']
                 };
  options.successStatusCode = 200;

  options.parseResults = function(response, body) {
    var result = JSON.parse(body);
    return result.pair ? result : null;
  };
  return glomeRequest(options);
}

showPairs = function(glomeid) {
  var retVal = verifyNotEmpty({glomeid:glomeid});
  if (!retVal.pass) {
    return retVal.reject;
  }
  var options = {};

  options.url = config["server"]
                .concat('/users/', glomeid, '/sync.json')
                .concat('?status=used&kind=b')

  // options.form = {};
  options.method = 'GET';
  //options.headers = { 'X-CSRF-Token'  : csrf };

  options.successStatusCode = 200;

  options.parseResults = function(response, body) {
    var result = JSON.parse(body);
    if (!result) {
      return null;
    }

    return result;
  };

  return glomeRequest(options);
}

sendData = function(glomeid, data, token, csrf) {
  if (!data) {
    return Promise.reject('Invalid data "' + data + '"')
  }
  var verifyList = {
    glomeid:glomeid,
    token:token,
    csrf:csrf,
    content : data.content,
    content : data.subject_id,
    content : data.kind
  }

  var retVal = verifyNotEmpty(verifyList);
  if (!retVal.pass) {
    return retVal.reject;
  }

  var options = {};
  options.url = config["server"].concat('/users/', glomeid, '/data.json');
  options.form = { 'userdata[content]': data.content,
                   'userdata[subject_id]': data.subject_id,
                   'userdata[kind]': data.kind
                 };
  options.headers = { 'X-CSRF-Token'    : csrf,
                      'X-Token'         : token };
  options.successStatusCode = 201;
  options.method = 'POST';

  options.parseResults = function(response, body) {
    return JSON.parse(body);

  };
  return glomeRequest(options);

}

getData = function(glomeid, uid, btoaFunc) {
  var retVal = verifyNotEmpty({glomeid:glomeid, uid:uid, btoaFunc: btoaFunc});
  if (!retVal.pass) {
    return retVal.reject;
  }
  var encoded = btoaFunc(uid);

  // remove base64 at some point'
  var options = {};
  options.url = config["server"].concat('/users/', glomeid, '/data/' + encoded + '.json');
  options.form = {per_page : 1, page : 1};
  options.headers = {};
  options.successStatusCode = 200;
  options.method = 'GET';

  options.parseResults = function(response, body) {
    var result = JSON.parse(body);
    if (!result.records) {
      return null;
    }
    return result.records.length > 0 ? result.records[0] : result.records;
  };
  return glomeRequest(options);
}

unpair = function (glomeid, syncid) {
  var retVal = verifyNotEmpty({glomeid:glomeid, syncid:syncid});
  if (!retVal.pass) {
    return retVal.reject;
  }
  var options = {};
  options.url = config["server"].concat('/users/', glomeid, '/sync/' + syncid + '/toggle.json');
  console.log("Url " + options.url);
  options.form = {};
  options.headers = {};
  options.successStatusCode = 200;
  options.method = 'POST';

  options.parseResults = function(response, body) {
    var result = JSON.parse(body);
    return result;
  };
  return glomeRequest(options);
}

module.exports.createId = createId;
module.exports.login = login;
module.exports.getIdFromStorage = getIdFromStorage;
module.exports.saveIdToStorage = saveIdToStorage;
module.exports.config = config;
module.exports.createSync = createSync;
module.exports.pair = pair
module.exports.showPairs = showPairs
module.exports.sendData = sendData
module.exports.getData = getData
module.exports.unpair = unpair