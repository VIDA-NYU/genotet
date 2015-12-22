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
  {
    name: 'upload binding',
    action: function(frisby) {
      var form = new FormData();
      form.append('type', 'binding');
      form.append('name', dataInfo.name);
      form.append('description', dataInfo.description);
      var fileInfo = data.getFile('wiggle', dataInfo.fileName);
      form.append('file', fileInfo.stream, {
        knownLength: fileInfo.size
      });
      frisby
        .post(server.uploadURL, form, {
          headers: {
            'content-type': 'multipart/form-data; boundary=' +
            form.getBoundary(),
            'content-length': form.getLengthSync()
          }
        })
        .expectStatus(200);
      return form;
    },
    check: function(body) {
      var json = JSON.parse(body);
      it('contains success field', function() {
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
      it('listed binding', function() {
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
          gene: 'wig-1',
          chr: '1'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      var firstValue = data.values[0];
      var lastValue = data.values[data.values.length - 1];
      expect(firstValue.x).toBe(2999997);
      float.equal(firstValue.value, 0.0593648);
      expect(lastValue.x).toBe(3000312);
      float.equal(lastValue.value, 0.0593648);
      expect(data.xMin).toBe(2999997);
      expect(data.xMax).toBe(3000312);
      float.equal(data.valueMax, 0.0593648);
      float.equal(data.allValueMax, 0.0593648);
      expect(data.gene).toBe('wig-1');
      expect(data.chr).toBe('1');
    }
  },
  {
    name: 'query binding chr3',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'binding',
          gene: 'wig-1',
          chr: '3',
          xl: 3000080,
          xr: 3000100
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      var firstValue = data.values[0];
      var lastValue = data.values[data.values.length - 1];
      expect(firstValue.x).toBe(3000080);
      float.equal(firstValue.value, 0.0593648);
      expect(lastValue.x).toBe(3000100);
      float.equal(lastValue.value, 0.0379);
      expect(data.xMin).toBe(3000080);
      expect(data.xMax).toBe(3000100);
      float.equal(data.valueMax, 0.0379);
      float.equal(data.allValueMax, 0.11873);
      expect(data.gene).toBe('wig-1');
      expect(data.chr).toBe('3');
    }
  }
];
chain.test(tests);
