var eol = require("./build/Release/eol.node");
var fs = require('fs');

var stream = fs.createReadStream(process.argv[2]);

var lines = 0;
var totalLength = 0;
var obj = new eol(function(buf) {
  process.stdout.write(buf);
  process.stdout.write('\n');
});
stream.on('data', function(data) {
  obj.add(data);
});