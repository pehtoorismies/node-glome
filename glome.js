

var CONFIG = (function() {
  var private = {
    'LOCALSTORAGE_KEY': 'glomeidloc'
  };
  return {
    get: function(name) { return private[name]; }
  };
})();


var request = require('request');


var configuration = {
  "server" : "https://api.glome.me",


};

// Set the headers
var headers = {
  'User-Agent'  : 'Super Agent/0.0.1',
  'Content-Type': 'application/json'
}

var CREATE_URL = "/users.json";
var LOGIN_URL  = "/users/login.json";

createGlomeId = function(appId, server, callback) {
  //callback();
  //console.log("createGlomeId " + appId['apiKey']);
  // Configure the request
  var options = {
      url: server + CREATE_URL,
      method: 'POST',
      headers: headers,
      form: {'application[apikey]': appId['apiKey'],
             'application[uid]': appId['uid'] },
      withCredentials: false
  }

  // Start the request
  request(options, function (error, response, body) {
      // console.log("*****    ERROR: *****");
      // console.log(error);
      // console.log("***** // ERROR: *****");
      // console.log("*****    RESPONSE: *****");
      // console.log(response);
      // console.log("***** // RESPONSE: *****");
      if (!error && response.statusCode == 201) {
          // Print out the response body
          console.log("SUCCESS callback");
          //callback(error, );
          //console.log(callback);
          console.log("/SUCCESS");
          //console.log(callback);
          //callback(body);

      }
  });
}

getIdFromStorage = function getIdFromStorage(webLocalStorage, storageId) {
  if (!webLocalStorage) {
    return false;
  }
  var key = storageId || CONFIG.get('LOCALSTORAGE_KEY');

  console.log(webLocalStorage);
  console.log("KEY " + key);
  var retVal = webLocalStorage.getItem(key);

  return retVal

}
saveToStorage = function saveToStorage(glomeid, webLocalStorage) {

}

login = function(glomeid, server, callback) {
  console.log("Server " + server);
  console.log("ID " + glomeid);
  // Configure the request

  var options = {
      url: server + LOGIN_URL,
      method: 'POST',
      headers: headers,
      form: {'user[glomeid]': glomeid },
      withCredentials: false
  }

  // Start the request
  request(options, function (error, response, body) {
      // console.log("*****    RESPONSE: *****");
      // console.log(response);
      // console.log("***** // RESPONSE: *****");
      // console.log("*****    ERROR: *****");
      // console.log(error);
      // console.log("***** // ERROR: *****");
      if (!error && response.statusCode == 200) {
          // Print out the response body
          console.log(body);
          callback(body);
      }
  });
}

module.exports.createGlomeId = createGlomeId;
module.exports.login = login;
module.exports.getIdFromStorage = getIdFromStorage;
module.exports.saveToStorage = saveToStorage;