var formData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

/** @const */
var expressionSpec = {};

/**
 * Data information for expression tests
 * @type {{
 *   name: string,
 *   description: string,
 *   fileName: string
 * }}
 */
expressionSpec.dataInfo = {
  name: 'expression-1',
  description: 'the first expression',
  fileName: 'expression-1.tsv'
};

/**
 * @typedef {{
 *   geneNames: string,
 *   conditionNames: string,
 *   values: !Array<!Array<number>>,
 *   valueMin: number,
 *   valueMax: number,
 *   allValueMin: number,
 *   allValueMax: number
 * }}
 */
expressionSpec.QueryResponse;

/**
 * Test cases for expression queries
 * @type {!Array<{
 *   name: string,
 *   action: function(!frisby),
 *   check: Function
 * }>}
 */
expressionSpec.tests = [
  {
    name: 'upload expression',
    action: function(frisby) {
      var form = new formData();
      form.append('type', 'expression');
      form.append('name', expressionSpec.dataInfo.name);
      form.append('fileName', expressionSpec.dataInfo.fileName);
      form.append('description', expressionSpec.dataInfo.description);
      var fileInfo = data.getFile('expression',
        expressionSpec.dataInfo.fileName);
      form.append('file', fileInfo.stream, {
        knownLength: fileInfo.size
      });
      server
        .postForm(frisby, form)
        .expectStatus(200);
    },
    check: function(body) {
      var data = /** @type {server.uploadResponse} */(JSON.parse(body));
      it('without error field', function() {
        expect(data.error).toBeUndefined();
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
      it('listed expression data', function() {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual({
          matrixName: expressionSpec.dataInfo.name,
          fileName: expressionSpec.dataInfo.fileName,
          description: expressionSpec.dataInfo.description
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
          fileName: expressionSpec.dataInfo.fileName,
          geneRegex: 'a|b',
          conditionRegex: '1|2'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = /** @type {expressionSpec.QueryResponse} */(JSON.parse(body));
      it('gene names', function() {
        expect(data.geneNames).toEqual(['a', 'b']);
      });
      it('condition names', function() {
        expect(data.conditionNames).toEqual(['cond1', 'cond2']);
      });
      it('values', function() {
        expect(data.values).toEqual([[1, 2], [4, 5]]);
      });
      it('min/max values', function() {
        expect(data.valueMin).toBe(1);
        expect(data.valueMax).toBe(5);
        expect(data.allValueMin).toBe(-1);
        expect(data.allValueMax).toBe(9);
      });
    }
  }
];
chain.test(expressionSpec.tests);
