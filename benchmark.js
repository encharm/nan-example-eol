var fs = require('fs');
var carrier = require('carrier');
var eol = require('./');

var assert = require('assert');

var split = require('split');

var linesCarrier = 0;
var linesEol = 0;

var lengthCarrier = 0;
var lengthEol = 0;

var linesSplit = 0;
var lengthSplit = 0;

function carrierTest(cb) {
  var begin = new Date().getTime();
  var stream = fs.createReadStream(process.argv[2]);

  carrier.carry(stream, function(line) {
    linesCarrier++;
    lengthCarrier += line.length;
  });
  stream.on('end', function() {
    console.log("Carrier took: ", (new Date().getTime()) - begin);
    cb();
  });
}

function eolTest(cb) {
  var begin = new Date().getTime();
  var stream = fs.createReadStream(process.argv[2]);

  eol.streamWrapper(stream, function(line) {
    linesEol++;
    lengthEol += line.length;
  });

  stream.on('end', function() {
    console.log("EOL took: ", (new Date().getTime()) - begin);
    cb();
  });
}

function splitTest(cb) {
  var begin = new Date().getTime();
  var stream = fs.createReadStream(process.argv[2])
    .pipe(split()).on('data', function(line) {
      linesSplit++;
      lengthSplit += line.length;
    });
  stream.on('end', function() {
    console.log("Split took: ", (new Date().getTime()) - begin);
    cb();
  });
}


eolTest(function() {
  carrierTest(function() {
    splitTest(function() {
      eolTest(function() {
        carrierTest(function() {
          splitTest(function() {
            console.log(linesSplit, linesCarrier);
            assert(linesCarrier == linesEol);
            assert(lengthCarrier == lengthEol);
          });
        });
      });
    });
  });
});