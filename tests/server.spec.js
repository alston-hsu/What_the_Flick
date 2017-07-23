var chai = require('chai');
var sinon = require('sinon');
var axios = require('axios');
var assert = chai.assert;
var expect = chai.expect;
var request = require('supertest');
var Promise = require('bluebird');

describe('Server', function() {
  var server;

  beforeEach(function () {
    server = require('../server');
  });

  it('loads for the root URL', function testRoot(done) {
    request(server.instance)
      .get('/')
      .expect(200, done);
  });

  it('retrieves movie genres', function (done) {
    // assume themoviedb actually returns a list of genres
    request(server.instance)
      .get('/genres')
      .expect(200)
      .then(function(res) {
        // console.log(JSON.stringify(res));
        var genres = JSON.parse(res.text);
        assert.typeOf(genres, 'array');
        expect(genres).to.not.be.empty;
        done();
      }, done);
  });

  it('fails for the guess route when passing no data', function (done) {
    request(server.instance)
      .post('/guess')
      .expect(500, done);
  });
});
