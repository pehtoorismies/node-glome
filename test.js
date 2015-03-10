// var glome = require("./glome.js");
// var gid = "a_cb131e_8dd1e0de5847df71e02628cb3c983c002015030606185106336340";

// glome.config.server = 'http://192.168.50.50:8765';

// // glome.showPairs(gid).then(function (result) {
// // 	console.log("Pairs");
// // 	console.log(result);
// // }).catch(function (err) {
// //     console.log(err);
// // });

// glome.createId().then(function (result) {
//   console.log("Created");
//   console.log(result);
// }).catch(function (err) {
//     console.log(err);
// });

// var data = {
//   koira : "spot",
//   nauta : "ayshyre",
//   boy   : "jonh"

// }
// var key;

// var keys = Object.keys(data);
// console.log(keys);

// for (i = 0; i < keys.length; i++) { 
//     console.log(data[keys[i]]);
// }
var g = require("./glome_new.js");

console.log(g.test());


//console.log(new Buffer("a1.glome.me").toString('base64'));



// var key = "glomeid";
// var prop = "1233";
// var str = "Invalid " + key + " " + "'" + prop + "'";

// console.log(str)

// var verify = function() {
//   console.log("Verifying");
//   return false;
// }

// var main = function() {
//   verify();
//   console.log("I am executin main");

// }

// main();