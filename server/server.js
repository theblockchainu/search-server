'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var client = require('../server/esConnection.js');

var app = module.exports = loopback();

app.get('/searchAll', function(req, res, next) {
  var Peer = app.models.peer;
  var filter = {};
  filter.index = '_all';
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

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
