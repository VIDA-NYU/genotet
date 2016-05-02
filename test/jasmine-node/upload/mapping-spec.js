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
 * Test cases for mapping queries.
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
      var fileInfo = data.getFile('mapping', mappingSpec.dataInfo.fileName);
      form.append('file', fileInfo.stream, {
        knownLength: fileInfo.size
      });
      server
        .postForm(frisby, form)
        .expectStatus(200);
    }
  },
  {
    name: 'list mapping',
    action: function(frisby) {
      server
        .get(frisby, {type: 'list-mapping'})
        .expectStatus(200);
    },
    check: function(data) {
      it('listed bed data', function() {
        expect(data.length).toBe(1);
        expect(data).toEqual([mappingSpec.dataInfo.fileName]);
      });
    }
  },
  {
    name: 'get mapping',
    action: function(frisby) {
      server
        .get(frisby, {
          type: 'mapping',
          fileName: mappingSpec.dataInfo.fileName
        })
        .expectStatus(200);
    },
    check: function(data) {
      it('mapping object', function() {
        expect(data).toEqual({
          a: 'wig-1.bw'
        });
      });
    }
  }
];

chain.test(mappingSpec.tests);
