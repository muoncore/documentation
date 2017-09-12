// "use strict";

var sodium = require('sodium').api;

process.stdout.write('Password: ');
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (input) {
  var password = Buffer.from('happy', 'utf8');

  var hash = new Buffer(128)
  hash.fill(null)
  hash.write("$argon2i$v=19$m=32768,t=4,p=1$dYa7EaMZd+pYC3xLikwS6w$l8q9K43jklEO8T9QdnQ0DC9X4ElZ6mO4zMsZYavRcF8", "utf8")

  var hash2 = sodium.crypto_pwhash_str(
    password,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE);

  console.log("Hash is '" + hash + "'")
  console.log("Hash is '" + hash2 + "'")

  var inPass = Buffer.from(input.trim(), 'utf8');

  var isValid = sodium.crypto_pwhash_str_verify(hash, inPass);
  console.log(isValid ? 'Correct.' : 'Incorrect.');

  process.exit();
});
