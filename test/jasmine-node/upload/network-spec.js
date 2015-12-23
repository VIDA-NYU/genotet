var FormData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

var dataInfo = {
  name: 'network-1',
  description: 'the first network',
  fileName: 'network-1.tsv'
};

var tests = [
  {
    name: 'upload network',
    action: function(frisby) {
      var form = new FormData();
      form.append('type', 'network');
      form.append('name', dataInfo.name);
      form.append('description', dataInfo.description);
      var fileInfo = data.getFile('network', dataInfo.fileName);
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
    name: 'list network',
    action: function(frisby) {
      frisby
        .get(server.queryURL({type: 'list-network'}))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('listed network data', function() {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual({
          networkName: dataInfo.name,
          fileName: dataInfo.fileName,
          description: dataInfo.description
        });
      });
    }
  },
  {
    name: 'query network',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'network',
          networkName: dataInfo.name,
          geneRegex: 'a|c|e'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('nodes', function() {
        expect(data.nodes).toEqual([
          {id: 'a', label: 'a', isTF: true},
          {id: 'c', label: 'c', isTF: true},
          {id: 'e', label: 'e', isTF: false}
        ]);
      });
      it('edges', function() {
        expect(data.edges).toEqual([
          {id: 'a,c', source: 'a', target: 'c', weight: [2, 3, 0]},
          {id: 'c,e', source: 'c', target: 'e', weight: [4, 1, 0]}
        ]);
      });
      it('weights', function() {
        expect(data.valueNames).toEqual(['attr1', 'attr2', 'attr3']);
        expect(data.weightMax).toBe(4);
        expect(data.weightMin).toBe(1);
      });
    }
  }
];
chain.test(tests);
