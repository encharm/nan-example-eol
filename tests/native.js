var eol = require("../build/Release/eol.node");
var mocha = require('mocha');
var should = require('should');

describe('native', function() {

  it('should handle single line in one buffer', function(cb) {

    var finder = new eol(function(buf) {
      var got = buf.toString('utf8');
      got.should.equal('aaaaaaa');
      cb();
    });
    finder.add(new Buffer("aaaaaaa\n", "utf8"));
  });

  it('should handle two lines one in each buffer', function(cb) {
    var count = 0;
    var finder = new eol(function(buf) {
      var got = buf.toString('utf8');
      got.should.equal('aaaaaaa');
      count++;
      if(count == 2)
        cb();
    });
    finder.add(new Buffer("aaaaaaa\n", "utf8"));
    finder.add(new Buffer("aaaaaaa\n", "utf8"));
  });

  it('should handle new line spanned across buffers', function(cb) {
    var finder = new eol(function(buf) {
      var got = buf.toString('utf8');
      got.should.equal('aaaaaaaaa1aaaaaaaaa2aaaaaaaaa3aaaaaaaa');
      cb();
    });
    finder.add(new Buffer("aaaaaaaaa1", "utf8"))
    finder.add(new Buffer("aaaaaaaaa2", "utf8"))
    finder.add(new Buffer("aaaaaaaaa3", "utf8"))
    finder.add(new Buffer("aaaaaaaa\n", "utf8"))

  });

  it('should handle mixed cases', function(cb) {
    var counter = 0;
    var result = '';
    var finder = new eol(function(buf) {
      result += buf.toString('utf8') + '\n';
      counter++;
      if(counter == 3) {
        result.should.equal('aaaaaaaaa1aaaaaaaaa2aaaaaaaaa3aaaaaaaa\naa\ndddaa\n');
        cb();
      }
    });
    finder.add(new Buffer("aaaaaaaaa1", "utf8"))
    finder.add(new Buffer("aaaaaaaaa2", "utf8"))
    finder.add(new Buffer("aaaaaaaaa3", "utf8"))
    finder.add(new Buffer("aaaaaaaa\n", "utf8"))
    finder.add(new Buffer("aa\nddd", "utf8"))
    finder.add(new Buffer("aa\nddd", "utf8"))
  });

  it('should handle multiple-lines in mixed cases', function(cb) {
    var counter = 0;
    var result = '';
    var finder = new eol(function(buf) {
      result += buf.toString('utf8') + '\n';
      counter++;
      if(counter == 6) {
        result.should.equal("ala\nma\nkota\nakot\nma\nale\n");
        cb();
      }
    });
    finder.add(new Buffer("ala\nma\nkota\na", "utf8"));
    finder.add(new Buffer("kot\nma\nale\nsdfdfs", "utf8"));

  });

});