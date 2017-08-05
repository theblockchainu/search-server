'use strict';
module.exports = function(Model, options) {
  Model['suggestAll'] = function(field, query, cb) {
    console.log('form suggestion query here');
    var searchQuery = {};
    searchQuery.native = {};
    searchQuery.native.query = {};
    searchQuery.native.query.match = {};
    searchQuery.native.query.match[field] = {
      'query': query,
      'analyzer': 'standard',
    };

    Model.find(searchQuery, function(err, results) {
      if (!err) {
        cb(null, results);
      } else {
        console.trace(err.message);
        if (err) {
          return cb(err, null);
        }
      }
    });
  };

  Model.remoteMethod(
    'suggestAll',
    {
      accepts: [
        {arg: 'field', type: 'string', required: true},
        {arg: 'query', type: 'string', required: true},
      ],
      returns: {arg: 'suggestions', type: 'object', root: true},
      http: {path: '/suggest', verb: 'get'},
    }
  );
};
