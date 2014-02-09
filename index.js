var eolNative = require("./build/Release/eol.node");
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = {
  streamWrapper: function(stream, onNewLine) {
    var emitter = new EventEmitter();

    var nativeFinder = new eolNative(function(buf) {
      if(onNewLine) onNewLine(buf.toString('utf8'));
    });
    stream.on('data', function(data) {
      nativeFinder.add(data);
    });

    return emitter;
  }
};
