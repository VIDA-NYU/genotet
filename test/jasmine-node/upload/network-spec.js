var FormData = require('form-data');
var querystring = require('querystring');

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
      describe('verify network upload success', function() {
        it('contains success field', function() {
          expect(json.success).toBe(true);
        });
      });
    }
  },
  {
    name: 'verify network',
    action: function(frisby) {
      frisby
        .get(server.url + '?' + querystring.stringify({
          type: 'list-network'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var networks = JSON.parse(body);
      describe('verify uploaded network', function() {
        // TODO(jdong): enable this after list network is pulled in.
        /*
        it('check listed network', function() {
          expect(networks.length).toBe(1);
          expect(networks[0]).toEqual({
            networkName: dataInfo.name,
            fileName: dataInfo.fileName,
            description: dataInfo.description
          });
        });
        */
      });
    }
  }
];

chain.test(tests);


