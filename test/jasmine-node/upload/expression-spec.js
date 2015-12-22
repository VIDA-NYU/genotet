var FormData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

var dataInfo = {
  name: 'expression-1',
  description: 'the first expression',
  fileName: 'expression-1.tsv'
};

var tests = [
  {
    name: 'upload expression',
    action: function(frisby) {
      var form = new FormData();
      form.append('type', 'expression');
      form.append('name', dataInfo.name);
      form.append('description', dataInfo.description);
      var fileInfo = data.getFile('expression', dataInfo.fileName);
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
    name: 'list expression',
    action: function(frisby) {
      frisby
        .get(server.queryURL({type: 'list-expression'}))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('listed expression', function() {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual({
          matrixName: dataInfo.name,
          fileName: dataInfo.fileName,
          description: dataInfo.description
        });
      });
    }
  },
  {
    name: 'query expression',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'expression',
          matrixName: 'expression-1',
          geneRegex: 'a|b',
          conditionRegex: '1|2'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('gene names', function() {
        expect(data.geneNames).toEqual(['a', 'b']);
      });
      it('condition names', function() {
        expect(data.conditionNames).toEqual(['cond1', 'cond2']);
      });
      console.log(data);
      it('values', function() {
        expect(data.values).toEqual([[1, 2], [4, 5]]);
        expect(data.valueMin).toBe(1);
        expect(data.valueMax).toBe(5);
        expect(data.allValueMin).toBe(-1);
        expect(data.allValueMax).toBe(9);
      });
    }
  }
];
chain.test(tests);
