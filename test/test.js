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
  nodeLocalStorage._deleteLocation()
  t.end();

});

test('create glome id', function (t) {
  t.plan(3);

  // Mock
  var appId = {
    'apiKey': '123',
    'uid': 'a1.glome.me'
  };
  var scope = nock('https://api.glome.me')
                  .post('/users.json', {'application[apikey]': appId['apiKey'], 'application[uid]': appId['uid'] })
                  .replyWithFile(201, __dirname + '/create.json');

  glome.createId(appId).then(function (glomeId) {
    t.equal("12345", glomeId, "Glome id should match the one from create.json");
  }).catch(function (err) {
    t.fail("Should not come here");
    t.end();
  });


  appId = {
    'apiKey': 'wrong',
    'uid': 'a1.glome.me'
  };
  glome.createId(appId).then(function (glomeId) {
    t.fail("Should not come here");
    t.end();
  }).catch(function (err) {
    t.pass("Wrong address ok");
  });

  // Mock
  appId = {
    'apiKey': '1233',
    'uid': 'a1.glome.me'
  };
  scope = nock('https://api.glome.me')
                  .post('/users.json', {'application[apikey]': appId['apiKey'], 'application[uid]': appId['uid'] })
                  .replyWithFile(201, __dirname + '/broken.json');

  glome.createId(appId).then(function (glomeId) {
    t.fail("Should not come here, malformatted json");
    t.end();
  }).catch(function (err) {
    t.pass("Malformatted json.");
  });
});

test('login glome', function (t) {
  t.plan(1);
  


}

// test('create glome id', function (t) {
//   t.plan(1);

//   var callback = function(error, glomeId) {
//     t.ok(error, "Error should be null");
//   }


//   glome.createGlomeId(appId, 'https://api.glome.me', callback);
//   console.log(callback);


//   t.ok(callback.calledOnce, "Tjep");

// });