var glome = require("./glome.js");
var gid = "a_cb131e_8dd1e0de5847df71e02628cb3c983c002015030606185106336340";

glome.config.server = 'http://192.168.50.50:8765';

// glome.showPairs(gid).then(function (result) {
// 	console.log("Pairs");
// 	console.log(result);
// }).catch(function (err) {
//     console.log(err);
// });

glome.createId().then(function (result) {
  console.log("Created");
  console.log(result);
}).catch(function (err) {
    console.log(err);
});