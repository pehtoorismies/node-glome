var request = require('request');

// Set the headers
var headers = {
  'User-Agent'  : 'Super Agent/0.0.1',
  'Content-Type': 'application/json'
}

var CREATE_URL = "/users.json";
var LOGIN_URL  = "/users/login.json";

createGlomeId = function(appId, server, callback) {
  console.log("createGlomeId " + appId['apiKey']);
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
      if (!error && response.statusCode == 200) {
          // Print out the response body
          console.log(body);
          callback(body);
      }
  });
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