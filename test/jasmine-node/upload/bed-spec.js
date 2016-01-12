var FormData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

/** @const */
var bedSpec = {};

/**
 * Data information of test cases
 * @type {{name: string, description: string, fileName: string}}
 */
bedSpec.dataInfo = {
  name: 'bed-1',
  description: 'the first bed track',
  fileName: 'bed-1.bed'
};

/**
 * Test cases of bed data
 * @type {!Array<*>}
 * @return {*}
 */
bedSpec.tests = [
  {
    name: 'upload bed',
    action: function(frisby) {
      var form = new formData();
      form.append('type', 'bed');
      form.append('name', bedSpec.dataInfo.name);
      form.append('fileName', bedSpec.dataInfo.fileName);
      form.append('description', bedSpec.dataInfo.description);
      var fileInfo = data.getFile('bed', bedSpec.dataInfo.fileName);
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
      describe('upload bed', function() {
        it('upload response is success', function() {
          expect(json.success).toBe(true);
        });
      });
    }
  },
  {
    name: 'list bed',
    action: function(frisby) {
      frisby
        .get(server.queryURL({type: 'list-bed'}))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      describe('list bed', function() {
        it('listed bed data', function() {
          expect(data.length).toBe(1);
          expect(data[0]).toEqual({
            bedName: bedSpec.dataInfo.name,
            fileName: bedSpec.dataInfo.fileName,
            description: bedSpec.dataInfo.description
          });
        });
      });
    }
  },
  {
    name: 'query bed chr1',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'bed',
          fileName: bedSpec.dataInfo.fileName,
          chr: '1'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      describe('query bed chr1', function() {
        it('without x range', function() {
          expect(data).toEqual([
            {chrStart: 49344650, chrEnd: 49344667, label: 'label_1_1'}
          ]);
        });
      });
    }
  },
  {
    name: 'query bed chr2',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'bed',
          fileName: bedSpec.dataInfo.fileName,
          chr: '2',
          xl: 26382900,
          xr: 101662495
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      describe('query bed chr2', function() {
        it('partially intersect', function() {
          expect(data).toEqual([
            {chrStart: 26382888, chrEnd: 26382905, label: 'label_2_2'},
            {chrStart: 101662494, chrEnd: 101662511, label: 'label_2_1'}
          ]);
        });
      });
    }
  },
  {
    name: 'query bed chr3',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'bed',
          fileName: bedSpec.dataInfo.fileName,
          chr: '3',
          xl: 40000000,
          xr: 50000000
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      describe('query bed chr3', function() {
        it('no intersection', function() {
          expect(data).toEqual([]);
        });
      });
    }
  }
];
chain.test(bedSpec.tests);
