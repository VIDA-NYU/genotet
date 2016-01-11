var FormData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');
var floats = require('../floats.js');

/** @const */
var bindingSpec = {};

/**
 * Data information for tests
 * @type {{name: string, description: string, fileName: string}}
 */
bindingSpec.dataInfo = {
  name: 'wig-1',
  description: 'the first binding track',
  fileName: 'wig-1.bw'
};

/**
 * Test cases for binding queries
 * @type {!Array<*>}
 * @return {*}
 */
bindingSpec.tests = [
  // TODO(jiaming): Handle bigWigToWig processing time. The server needs to
  // somehow let the client know that the data is ready. The binding query tests
  // should be run after the wig processing is complete.
  {
    name: 'upload binding',
    action: function(frisby) {
      var form = new FormData();
      form.append('type', 'binding');
      form.append('name', bindingSpec.dataInfo.name);
      form.append('fileName', bindingSpec.dataInfo.fileName);
      form.append('description', bindingSpec.dataInfo.description);
      var fileInfo = data.getFile('wiggle', bindingSpec.dataInfo.fileName);
      form.append('file', fileInfo.stream, {
        knownLength: fileInfo.size
      });
      server
        .postForm(frisby, form)
        .expectStatus(200);
      return form;
    },
    check: function(body) {
      var json = JSON.parse(body);
      describe('upload binding', function() {
        it('upload response is success', function() {
          expect(json.success).toBe(true);
        });
      });
    }
  },
  {
    name: 'list binding',
    action: function(frisby) {
      frisby
        .get(server.queryURL({type: 'list-binding'}))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      describe('list binding', function() {
        it('listed binding data', function() {
          expect(data.length).toBe(1);
          expect(data[0]).toEqual({
            gene: bindingSpec.dataInfo.name,
            fileName: bindingSpec.dataInfo.fileName,
            description: bindingSpec.dataInfo.description
          });
        });
      });
    }
  },
  {
    name: 'query binding chr1',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'binding',
          fileName: bindingSpec.dataInfo.fileName,
          chr: '1',
          numSamples: 6
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      describe('query binding chr1', function() {
        it('data points', function() {
          var firstValue = data.values[0];
          var lastValue = data.values[data.values.length - 1];
          expect(firstValue.x).toBe(2999997);
          floats.equal(firstValue.value, 0.0593648);
          expect(lastValue.x).toBe(3000312);
          floats.equal(lastValue.value, 0.0593648);
        });
      });
      describe('query binding chr1', function() {
        it('x range', function() {
          expect(data.xMin).toBe(2999997);
          expect(data.xMax).toBe(3000312);
        });
      });
      describe('query binding chr1', function() {
        it('max values', function() {
          floats.equal(data.valueMax, 0.0593648);
          floats.equal(data.allValueMax, 0.0593648);
        });
      });
      describe('query binding chr1', function() {
        it('gene and chr', function() {
          expect(data.gene).toBe('wig-1');
          expect(data.chr).toBe('1');
        });
      });
    }
  },
  {
    name: 'query binding chr3',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'binding',
          fileName: bindingSpec.dataInfo.fileName,
          chr: '3',
          xl: 3000080,
          xr: 3000100,
          numSamples: 6
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      var firstValue = data.values[0];
      var lastValue = data.values[data.values.length - 1];
      describe('query binding chr3', function() {
        it('data points', function() {
          expect(firstValue.x).toBe(3000080);
          floats.equal(firstValue.value, 0.0593648);
          expect(lastValue.x).toBe(3000100);
          floats.equal(lastValue.value, 0.11873);
        });
      });
      describe('query binding chr3', function() {
        it('x range', function() {
          expect(data.xMin).toBe(3000080);
          expect(data.xMax).toBe(3000100);
        });
      });
      describe('query binding chr3', function() {
        it('max values', function() {
          floats.equal(data.valueMax, 0.11873);
          floats.equal(data.allValueMax, 0.11873);
        });
      });
      describe('query binding chr3', function() {
        it('gene and chr', function() {
          expect(data.gene).toBe('wig-1');
          expect(data.chr).toBe('3');
        });
      });
    }
  }
];
chain.test(bindingSpec.tests);
