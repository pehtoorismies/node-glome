var test = require("tape"),
    nock = require("nock"),
    glome = require("../glome.js");

// Start tests
// ---
test('test local storage', function (t) {
  var gid, glomeId;
  var Storage = require('node-localstorage').LocalStorage;
  var nodeLocalStorage = new Storage('./test/tmp');

  t.plan(7);

  glomeId = glome.getIdFromStorage(null);
  t.notOk(glomeId, "When localstorage is null, no glome id found");

  glomeId = glome.getIdFromStorage(nodeLocalStorage);
  t.notOk(glomeId, "When localstorage has no key, no glome id found");

  glomeId = glome.saveIdToStorage(gid, nodeLocalStorage);
  t.notOk(glomeId, "When glome id is empty, cant save to localstorage");

  gid = "12341234-12341234";
  glomeId = glome.saveIdToStorage(gid);
  t.notOk(glomeId, "When localstorage is empty, cant save to glome id");

  glomeId = glome.saveIdToStorage(gid, nodeLocalStorage);
  t.ok(glomeId, "Should save glome id to local storage");

  glomeId = glome.getIdFromStorage(nodeLocalStorage);
  t.equal(gid, glomeId, "Fetched glome id should match the stored");

  glome.saveIdToStorage(gid, nodeLocalStorage, "myKey");
  glomeId = glome.getIdFromStorage(nodeLocalStorage, "myKey");
  t.equal(gid, glomeId, "Fetched glome id should match the stored with specified key name");

  // remove localstorage
  nodeLocalStorage._deleteLocation();

});

test('config changes', function (t) {
  var storeValue = glome.config["server"];

  t.plan(2);

  t.ok(glome.config["server"].length > 5, "Config default server.");

  glome.config["server"] = "myserver.com";
  t.equal(glome.config.server,"myserver.com", "Changed config server.");

  glome.config["server"] = storeValue;
});

test("Create glome id", function (t) {
  // Mock
  var appId = {'apiKey': '135ee5bb341e126435b5ef4804cb131e','uid': 'a1.glome.me'};
  var scope = nock(glome.config.server)
                  .post(glome.config.url_create, {'application[apikey]': appId['apiKey'], 'application[uid]': appId['uid'] })
                  .replyWithFile(201, __dirname + '/create.json');

  glome.createId(appId).then(function (result) {
    t.ok(result.glomeid.length > 30, "Glome id should match the one from create.json");
    t.end();
  }).catch(function (err) {
    t.end("Should compare 12345 to glomeid: " + err);
  });
});

test('Try to create glome id with wrong api key', function (t) {
  var appId = {
    'apiKey': 'wrong',
    'uid': 'a1.glome.me'
  };
  var scope = nock(glome.config.server)
                  .post(glome.config.url_create, {'application[apikey]': appId['apiKey'], 'application[uid]': appId['uid'] })
                  .replyWithFile(403, __dirname + '/create_no_auth.json');


  glome.createId(appId).then(function (glomeId) {
    t.end("Should fail");

  }).catch(function (err) {
    t.pass("Wrong credentials");
    t.end();
  });
});

test("Create glome and return malformatted json", function (t) {

  // Mock
  var appId = {
    'apiKey': '1233',
    'uid': 'a1.glome.me'
  };
  scope = nock(glome.config.server)
                  .post(glome.config.url_create, {'application[apikey]': appId['apiKey'], 'application[uid]': appId['uid'] })
                  .replyWithFile(201, __dirname + '/broken.json');

  glome.createId(appId).then(function (glomeId) {
    t.end("Should not come here, malformatted json");
  }).catch(function (err) {
    t.pass("Malformatted json.");
    t.end();
  });
});

test("Create glomeid: No appKey, using proxy", function (t) {
   var orgServer = glome.config.server;
   glome.config.server = "http://glome.proxy";

  scope = nock("http://glome.proxy")
                  .post(glome.config.url_create)
                  .replyWithFile(201, __dirname + '/create.json');


  glome.createId().then(function (glomeId) {
    t.ok(glomeId, "Glome id is ok");
    t.end()

  }).catch(function (err) {
    console.log(err);
    t.end("Should use proxy");
  });

  glome.config.server = orgServer;

});

test('Test login with empty glome id', function (t) {

  glome.login(null).then(function (glomeId) {
    t.end("Login with null should fail");
  }).catch(function (err) {
    t.pass("Login with null");
  });

  glome.login("wrong_id").then(function (glomeId) {
    t.end("Login with null should fail");
  }).catch(function (err) {
    t.pass("Login with null");
    t.end();
  });
});

test('Test login with wrong glome id', function (t) {

  var wrongGlomeId = "wrongGlomeId";
  scope = nock(glome.config.server)
                  .post(glome.config.url_login, {'user[glomeid]': wrongGlomeId })
                  .replyWithFile(403, __dirname + '/login_error.json');

  glome.login(wrongGlomeId).then(function (res) {
    t.end("Login should be denied, wrong id.");
  }).catch(function (err) {
    t.pass("Passed " + err);
    t.end();
  });
});


test('Test login with correct glome id', function (t) {
  var glomeid = require('./login_success.json').glomeid;

  scope = nock(glome.config.server)
                  .post(glome.config.url_login, {'user[glomeid]': glomeid })
                  .replyWithFile(200, __dirname + '/login_success.json', {
                      'X-CSRF-Token' : 'FptMcTnZAwN6ydH9RYr08Kn37bmrXzOvmNrG9Oy+tI8='
                  });

  glome.login(glomeid).then(function (glomeId, x_csrf_token, auth_token, auth_token_exp) {
    t.pass("Login with proper glome id should pass");
    t.end();
  }).catch(function (err) {
    t.end("Login with proper glome id should not fail");
  });
});

test('Test login with proxy', function (t) {
  var glomeid = require('./login_success.json').glomeid
  var orgServer = glome.config.server;
  glome.config.server = "http://glome.proxy";

  scope = nock(glome.config.server)
                  .post(glome.config.url_login, {'user[glomeid]': glomeid })
                  .replyWithFile(200, __dirname + '/login_success.json', {
                      'X-CSRF-Token' : 'FptMcTnZAwN6ydH9RYr08Kn37bmrXzOvmNrG9Oy+tI8=',
                      'X-Token' : '384be03b491fb88a64780c9388f2e0fc',
                      'X-Token-exp' : 'Wed, 04 Mar 2015 10:26:53 -0000'
                  });

  glome.login(glomeid).then(function (result) {
    t.equal(result.glomeId, glomeid, "glomeid match");
    t.equal(result.x_csrf_token, 'FptMcTnZAwN6ydH9RYr08Kn37bmrXzOvmNrG9Oy+tI8=', "x_csrf_token match");
    t.equal(result.auth_token, '384be03b491fb88a64780c9388f2e0fc', "auth_token match");
    t.equal(result.auth_token_exp, 'Wed, 04 Mar 2015 10:26:53 -0000', "auth_token_exp match");

    t.pass("Login with proxy should pass");
    t.end();
  }).catch(function (err) {
    t.end("Login with proper proxy should not fail");
  });

  glome.config.server = orgServer;
});

test('Test create sync token', function(t) {
  var glomeid = "12345";
  var csrf = 'XSfCWjuUeGTnpceC+4bsuNG6la3wJMDPasinr6RzLyY='

  scope = nock(glome.config.server)
                  .post('/users/' + glomeid + '/sync.json', {'synchronization[kind]' : 'b'})
                  .matchHeader('X-CSRF-Token', csrf)
                  .replyWithFile(201, __dirname + '/create_sync.json', {

                  });

  glome.createSync(glomeid, csrf).then(function (result) {
    t.equal(result.expires_at, "2015-03-02T12:31:37.804Z", "expires_at match");
    t.equal(result.code, "994e27adb5b6", "code match");
    t.end();

  }).catch(function (err) {
    console.log(err);
    t.end("Create sync should not not fail");
  });
});

test('Test pair device incorrect code', function(t) {
  var glomeid = "12345";
  var token = "432142123";
  var pairingCode = "12341234asdf"
  var csrf = 'XSfCWjuUeGTnpceC+4bsuNG6la3wJMDPasinr6RzLyY=';

  scope = nock(glome.config.server)
              .post('/users/' + glomeid + '/sync/pair.json',
                {'pairing[code_1]' : '1234',
                 'pairing[code_2]' : '1234',
                 'pairing[code_3]' : 'asdf'})

              .matchHeader('X-CSRF-Token', csrf)
              .matchHeader('X-Token', token)
              .replyWithFile(422, __dirname + '/sync_invalid_code.json', {

              });

  glome.pair(glomeid, pairingCode, token, csrf).then(function (result) {
    t.end("Should catch incorrect pairing code");
  }).catch(function (err) {
    errObject = JSON.parse(err);
    t.ok(errObject.code == 2201, "Correct code 2201 - wrong code");
    t.end();
  });
});

test('Test pair device code already used', function(t) {
  var glomeid = "12345";
  var token = "43211234";
  var pairingCode = "12341234asdf"
  var csrf = 'XSfCWjuUeGTnpceC+4bsuNG6la3wJMDPasinr6RzLyY=';

  scope = nock(glome.config.server)
              .post('/users/' + glomeid + '/sync/pair.json',
                {'pairing[code_1]' : '1234',
                 'pairing[code_2]' : '1234',
                 'pairing[code_3]' : 'asdf'})

              .matchHeader('X-CSRF-Token', csrf)
              .matchHeader('X-Token', token)
              .replyWithFile(422, __dirname + '/sync_alreadypaired.json', {

              });

  glome.pair(glomeid, pairingCode, token, csrf).then(function (result) {
    t.end("Should catch incorrect pairing code");
  }).catch(function (err) {
    errObject = JSON.parse(err);
    t.ok(errObject.code == 2202, "Correct code 2202 - wrong code");
    t.end();
  });
});

test('Test pair device', function(t) {
  var glomeid = "12345";
  var token = "43211234";
  var pairingCode = "12341234asdf"

  var csrf = 'XSfCWjuUeGTnpceC+4bsuNG6la3wJMDPasinr6RzLyY=';

  scope = nock(glome.config.server)
              .post('/users/' + glomeid + '/sync/pair.json',
                {'pairing[code_1]' : '1234',
                 'pairing[code_2]' : '1234',
                 'pairing[code_3]' : 'asdf'})

              .matchHeader('X-CSRF-Token', csrf)
              .matchHeader('X-Token', token)
              .replyWithFile(200, __dirname + '/sync_success.json', {

              });

  glome.pair("", "123433", token, csrf).then(function (result) {
    t.end("Should catch incorrect glome id");
  }).catch(function (err) {
    t.ok(err.toString().indexOf("Invalid glomeid") === 0, "Invalid glome id");
  });


  glome.pair(glomeid, "123433", token, csrf).then(function (result) {
    t.end("Should catch incorrect pair code");
  }).catch(function (err) {
    t.ok(err.toString().indexOf("Invalid code") === 0, "Invalid code");
  });

  glome.pair(glomeid, "12341234asdf", token, csrf).then(function (result) {
    t.ok(result.pair, "has pair");
    t.ok(result.pair.glomeid, "has glome id");
    t.end();
  }).catch(function (err) {
    console.log(err);
    t.end("Syncing should not not fail");
  });
});

test('List pairings', function(t){
  var glomeid = "123434s";
  scope = nock(glome.config.server)
              .get('/users/' + glomeid + '/services.json')
              .replyWithFile(200, __dirname + '/services_success.json', {

              });

  glome.showPairs(null).then(function (result) {
    t.end("Should catch incorrect glomeid while showing pairs");
  }).catch(function (err) {
    console.log(err);
    t.ok(err.toString().indexOf("Invalid glomeid") === 0, "Invalid glomeid");
  });
  glome.showPairs(glomeid).then(function (result) {
    t.equal(result.instances.length, 3,"Has three pairs");

    t.end();
  }).catch(function (err) {
    console.log(err);
    t.end("Should not fail when showing pairs");
  });
});

test('Save data', function(t) {
  var glomeid = "123434";
  var token = "1231234124";
  var csrf = "12323423523423";
  var data = {
      content : "catflix",
      subject_id      : 1,
      kind    : "v"
  }
   var missingData = {
      content : "catflix",
  }

  glome.sendData(glome, missingData, token, csrf).then(function (result) {
    t.end("Should catch wrong user data");
  }).catch(function (err) {
    console.log(err);
    t.ok(err.toString().indexOf("Invalid content") === 0, "Invalid data");
  });
  glome.sendData(glome, data, null, csrf).then(function (result) {
    t.end("Should catch wrong user token");
  }).catch(function (err) {
    t.ok(err.toString().indexOf("Invalid token") === 0, "Invalid data");
  });

  scope = nock(glome.config.server)
              .post('/users/' + glomeid + '/data.json')
              .matchHeader('X-CSRF-Token', csrf)
              .matchHeader('X-Token', token)
              .replyWithFile(201, __dirname + '/data_success.json', {

              });

  glome.sendData(glomeid, data, token, csrf).then(function (result) {
    t.equal(result.subject_id, 1, "The subject id");
    t.end();
  }).catch(function (err) {
    console.log(err);
    t.end("Should create user data");
  });
});

test('Get data', function(t) {
  var glomeid = "123412341234",
      uid = "a1.glome.me",
      btoa = require("btoa");

  scope = nock(glome.config.server)
              .get('/users/' + glomeid + '/data/YTEuZ2xvbWUubWU=.json')
              .replyWithFile(200, __dirname + '/get_user_data.json', {

              });

  glome.getData(glomeid, uid, btoa).then(function (result) {
    t.equal(result.subject_id,214456, "Subject_id");
    t.equal(result.kind,"p", "Kind");
    t.end();
  }).catch(function (err) {
    console.log(err)
    t.end("Should get userdata");
  });
});