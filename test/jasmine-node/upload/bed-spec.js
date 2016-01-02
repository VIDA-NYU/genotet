var FormData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

var dataInfo = {
  name: 'bed-1',
  description: 'the first bed track',
  fileName: 'bed-1.bed'
};

var tests = [
  {
    name: 'upload bed',
    action: function(frisby) {
      var form = new FormData();
      form.append('type', 'bed');
      form.append('name', dataInfo.name);
      form.append('fileName', dataInfo.fileName);
      form.append('description', dataInfo.description);
      var fileInfo = data.getFile('bed', dataInfo.fileName);
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
    name: 'list bed',
    action: function(frisby) {
      frisby
        .get(server.queryURL({type: 'list-bed'}))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('listed bed data', function() {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual({
          bedName: dataInfo.name,
          fileName: dataInfo.fileName,
          description: dataInfo.description
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
          bedName: dataInfo.name,
          chr: '1'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('without x xrange', function() {
        expect(data).toEqual([
          {chromStart: 49344650, chromEnd: 49344667, label: 'label_1_1'}
        ]);
      });
    }
  },
  {
    name: 'query bed chr2',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'bed',
          bedName: dataInfo.name,
          chr: '2',
          xl: 26382900,
          xr: 101662495
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('partially intersect', function() {
        expect(data).toEqual([
          {chromStart: 26382888, chromEnd: 26382905, label: 'label_2_2'},
          {chromStart: 101662494, chromEnd: 101662511, label: 'label_2_1'}
        ]);
      });
    }
  },
  {
    name: 'query bed chr3',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'bed',
          bedName: dataInfo.name,
          chr: '3',
          xl: 40000000,
          xr: 50000000
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('no intersection', function() {
        expect(data).toEqual([]);
      });
    }
  }
];
chain.test(tests);
