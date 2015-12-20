var frisby = require('frisby');
var fs = require('fs');
var path = require('path');
var FormData = require('form-data');

var serverURL = 'http://localhost:3000/genotet';
var contentPath = path.resolve(__dirname, '../../data/network/network-1.tsv');
var form = new FormData();

form.append('type', 'network');
form.append('name', 'network-1');
form.append('description', 'the first network');
form.append('file', fs.createReadStream(contentPath), {
  knownLength: fs.statSync(contentPath).size
});

frisby.create('upload network')
  .post(serverURL + '/upload', form, {
    headers: {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': form.getLengthSync()
    }
  })
  .expectStatus(200)
  .afterJSON(function(json) {
    describe('verify response', function() {
      it('contains success field', function() {
        expect(json.success).toBe(true);
      });
    });
    /*
    frisby.create('verify network file')
      .get(serverURL, {

      })
      .expectJSON
      .toss();
    */
  })
  .toss();
