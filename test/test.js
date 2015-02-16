var test = require("tape"),
    nock = require("nock"),
    glome = require("../glome.js"),
    sinon = require("sinon"),
    nodeLocalStorage = require('node-localstorage');

var appId = {
  'apiKey': '135ee5bb341e126435b5ef4804cb131e',
  'uid': 'a1.glome.me'
};

var gid;

var scope = nock('https://api.glome.me')
                  .post('/users.json', {'application[apikey]': appId['apiKey'], 'application[uid]': appId['uid'] })
                  .replyWithFile(201, __dirname + '/create.json');

var glomeId;

test('find glome id from local storage', function (t) {
  t.plan(5);

  glomeId = glome.getIdFromStorage(null);
  t.notOk(glomeId, "There should not be glome id");

  glomeId = glome.getIdFromStorage(nodeLocalStorage);
  t.notOk(glomeId, "There should not be glome id");

  glomeId = glome.saveToStorage(gid, nodeLocalStorage);
  t.notOk(glomeId, "No id to save");

  gid = "12341234-12341234";
  glomeId = glome.saveToStorage(gid);
  t.notOk(glomeId, "No localstorage to save");

  glomeId = glome.saveToStorage(gid, nodeLocalStorage);
  t.ok(glomeId, "Saved successfully");


});

// test('create glome id', function (t) {
//   t.plan(1);

//   var callback = function(error, glomeId) {
//     t.ok(error, "Error should be null");
//   }


//   glome.createGlomeId(appId, 'https://api.glome.me', callback);
//   console.log(callback);


//   t.ok(callback.calledOnce, "Tjep");

// });