var FormData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');
var float = require('../float.js');

var dataInfo = {
  name: 'wig-1',
  description: 'the first binding track',
  fileName: 'wig-1.bw'
};

var tests = [
  // TODO(jiaming): Handle bigWigToWig processing time. The server needs to
  // somehow let the client know that the data is ready. The binding query tests
  // should be run after the wig processing is complete.
  {
    name: 'upload binding',
    action: function(frisby) {
      var form = new FormData();
      form.append('type', 'binding');
      form.append('name', dataInfo.name);
      form.append('fileName', dataInfo.fileName);
      form.append('description', dataInfo.description);
      var fileInfo = data.getFile('wiggle', dataInfo.fileName);
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
      it('upload response is success', function() {
        expect(json.success).toBe(true);
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
      it('listed binding data', function() {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual({
          gene: dataInfo.name,
          fileName: dataInfo.fileName,
          description: dataInfo.description
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
          fileName: dataInfo.fileName,
          chr: '1',
          numSamples: 6
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('data points', function() {
        var firstValue = data.values[0];
        var lastValue = data.values[data.values.length - 1];
        expect(firstValue.x).toBe(2999997);
        float.equal(firstValue.value, 0.0593648);
        expect(lastValue.x).toBe(3000312);
        float.equal(lastValue.value, 0.0593648);
      });
      it('x range', function() {
        expect(data.xMin).toBe(2999997);
        expect(data.xMax).toBe(3000312);
      });
      it('max values', function() {
        float.equal(data.valueMax, 0.0593648);
        float.equal(data.allValueMax, 0.0593648);
      });
      it('gene and chr', function() {
        expect(data.gene).toBe('wig-1');
        expect(data.chr).toBe('1');
      });
    }
  },
  {
    name: 'query binding chr3',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'binding',
          fileName: dataInfo.fileName,
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
      it('data points', function() {
        expect(firstValue.x).toBe(3000080);
        float.equal(firstValue.value, 0.0593648);
        expect(lastValue.x).toBe(3000100);
        float.equal(lastValue.value, 0.0379);
      });
      it('x range', function() {
        expect(data.xMin).toBe(3000080);
        expect(data.xMax).toBe(3000100);
      });
      it('max values', function() {
        float.equal(data.valueMax, 0.0379);
        float.equal(data.allValueMax, 0.11873);
      });
      it('gene and chr', function() {
        expect(data.gene).toBe('wig-1');
        expect(data.chr).toBe('3');
      });
    }
  }
];
chain.test(tests);
