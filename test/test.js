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

  glomeId = glome.saveToStorage(gid, nodeLocalStorage);
  t.notOk(glomeId, "When glome id is empty, cant save to localstorage");

  gid = "12341234-12341234";
  glomeId = glome.saveToStorage(gid);
  t.notOk(glomeId, "When localstorage is empty, cant save to glome id");

  glomeId = glome.saveToStorage(gid, nodeLocalStorage);
  t.ok(glomeId, "Should save glome id to local storage");

  glomeId = glome.getIdFromStorage(nodeLocalStorage);
  t.equal(gid, glomeId, "Fetched glome id should match the stored");

  glome.saveToStorage(gid, nodeLocalStorage, "myKey");
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

  glome.createId(appId).then(function (glomeId) {
    t.ok(glomeId.length > 30, "Glome id should match the one from create.json");
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
  var glomeid = "123123";

  scope = nock(glome.config.server)
                  .post(glome.config.url_login, {'user[glomeid]': glomeid })
                  .replyWithFile(200, __dirname + '/login_success.json');

  glome.login(glomeid).then(function (res) {
    t.pass("Login with proper glome id should pass");
    t.end();
  }).catch(function (err) {
    t.end("Login with proper glome id should not fail");
  });
});
