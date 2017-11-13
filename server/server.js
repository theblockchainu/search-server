'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var client = require('../server/esConnection.js');
var https = require('https');
var http = require('http');
var sslConfig = require('./ssl-config');

var app = module.exports = loopback();

app.get('/searchAll', function(req, res, next) {
  var Peer = app.models.peer;
  var codeString = app.get('uniqueDeveloperCode') + '_';
  var indexString = codeString + 'collection,' + codeString + 'topic,' + codeString + 'peer';
  var filter = {};
  filter.index = 'collection,topic,peer';
  filter.body = {
    'query': {
      'multi_match': {
        'query': req.query.query,
        'fields': ['title', 'name', 'username', 'profiles.first_name', 'profiles.last_name'],
      },
    },
  };
  client.search(filter, function(err, resp, status) {
    if (err) {
      res.json(err);
    }    else {
      var result = [];
      if (resp.hits.hits) {
        resp.hits.hits.forEach(function(resultItem) {
          var newResultFormat = {};
          newResultFormat.index = resultItem._index;
          newResultFormat.data = resultItem._source;
          result.push(newResultFormat);
        });
        res.json(result);
      }      else {
        res.json(resp);
      }
    }
  });
});

app.start = function(httpOnly) {
  if (httpOnly === undefined) {
    httpOnly = process.env.HTTP;
  }
  var server = null;
  if (!httpOnly) {
    var options = {
      key: sslConfig.privateKey,
      cert: sslConfig.certificate,
    };
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }
  // start the web server
  server.listen(app.get('port'), function() {
    var baseUrl = (httpOnly? 'http://' : 'https://') + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
  return server;
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
