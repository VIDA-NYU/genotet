var formData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

/** @const */
var mappingSpec = {};
/**
 * Data information for test cases.
 * @type {{fileName: string}}
 */
mappingSpec.dataInfo = {
  fileName: 'mapping-1.txt'
};

/**
 * Test cases of mapping data.
 * @type {!Array<{
 *   name: string,
 *   action: function(!frisby),
 *   check: Function
 * }>}
 */
mappingSpec.tests = [
  {
    name: 'upload mapping',
    action: function(frisby) {
      var form = new formData();
      form.append('type', 'mapping');
      form.append('fileName', mappingSpec.dataInfo.fileName);
      var fileInfo = data.getFile('mapping', mappingSpec.dataInfo.fileName);
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
    name: 'list mapping',
    action: function(frisby) {
      frisby
        .get(server.queryURL({type: 'list-mapping'}))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('listed bed data', function() {
        expect(data.length).toBe(1);
        expect(data).toEqual([mappingSpec.dataInfo.fileName]);
      });
    }
  },
  {
    name: 'get mapping',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'mapping',
          fileName: mappingSpec.dataInfo.fileName
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('mapping object', function() {
        expect(data).toEqual({
          a: 'wig-1.bw'
        });
      });
    }
  }
];

chain.test(mappingSpec.tests);
