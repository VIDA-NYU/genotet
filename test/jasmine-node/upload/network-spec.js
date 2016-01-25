var formData = require('form-data');
var querystring = require('querystring');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

/** @const */
var networkSpec = {};

/**
 * Data information of network tests.
 * @type {{
 *   name: string,
 *   description: string,
 *   fileName: string
 * }}
 */
networkSpec.dataInfo = {
  name: 'network-1',
  description: 'the first network',
  fileName: 'network-1.tsv'
};

/**
 * @typedef {{
 *   nodes: !Array<{
 *     id: string,
 *     label: string,
 *     isTF: boolean
 *   }>,
 *   edges: !Array<{
 *     id: string,
 *     source: string,
 *     target: string,
 *     weight: !Array<number>
 *   }>,
 *   weightMin: number,
 *   weightMax: number,
 *   valueNames: !Array<string>
 * }}
 */
networkSpec.QueryResponse;

/**
 * Test cases of network queries
 * @type {!Array<{
 *   name: string,
 *   action: function(!frisby),
 *   check: Function
 * }>}
 */
networkSpec.tests = [
  {
    name: 'upload network',
    action: function(frisby) {
      var form = new formData();
      form.append('type', 'network');
      form.append('name', networkSpec.dataInfo.name);
      form.append('description', networkSpec.dataInfo.description);
      var fileInfo = data.getFile('network', networkSpec.dataInfo.fileName);
      form.append('file', fileInfo.stream, {
        knownLength: fileInfo.size
      });
      server
        .postForm(frisby, form)
        .expectStatus(200);
    },
    check: function(body) {
      var data = /** @type {server.UploadResponse} */(JSON.parse(body));
      it('without error field', function() {
        expect(data.error).toBeUndefined();
      });
    }
  },
  {
    name: 'query network',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'network',
          fileName: networkSpec.dataInfo.fileName,
          genes: ['a', 'c', 'e']
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = /** @type {networkSpec.QueryResponse} */(JSON.parse(body));
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
        expect(data.weightMin).toBe(0);
      });
    }
  }
];
chain.test(networkSpec.tests);
