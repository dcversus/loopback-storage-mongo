var _ = require('lodash');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var Grid = require('gridfs-stream');
var GridFS = mongodb.GridFS;
var utils = {};
module.exports = utils;

/**
 * generateUrl desc
 */
utils.generateUrl = function(options) {
  var host = options.host || options.hostname || 'localhost';
  var port = options.port || 27017;
  var database = options.database || 'test';

  if (options.username && options.password) {
    return "mongodb://" + options.username + ":" + options.password + "@" + host + ":" + port + "/" + database;
  } else {
    return "mongodb://" + host + ":" + port + "/" + database;
  }
};

/**
 * renameKeys desc
 */
utils.renameKeys = function(o){
  var build, key, destKey, ix, value;

  var map = {
    "inq": "$in"
  };

  build = {};
  for (key in o) {
    destKey = map[key] || key;
    value = o[key];

    if (typeof value === "object" && !(value instanceof Array)) {
        value = utils.renameKeys(value);
    }

    build[destKey] = value;
  }
  return build;
}

/**
 * clearOutput desc
 */
utils.clearOutput = function(data) {
  if(data instanceof Array) {
    data.map(function(element) {
      return utils.clearOutput(element)
    })
  }

  var result = _.extend(data, data['metadata'])
  delete result['metadata'];
  delete result['__data'];
  delete result['__dataSource'];
  delete result['__strict'];
  delete result['__persisted'];
  delete result['__cachedRelations'];
  delete result['mongo-storage'];
  result['id'] = result['_id'];
  delete result['_id'];
  return result;
}

/**
 * uploadFile descr
 * @param {Object} filter object descr
 * @callback {Function} callback Callback function
 */
utils.upload = function(db, file, options, callback) {
  if (callback == null) {
    callback = (function() {});
  }
  options._id = new ObjectID();
  options.mode = 'w';

  var gfs = Grid(db, mongodb);
  var stream = gfs.createWriteStream(options);
  stream.on('close', function(metaData) {
    return callback(null, metaData);
  });
  stream.on('error', callback);
  return file.pipe(stream);
};

/**
 * download descr
 * @param {Object} filter object descr
 * @callback {Function} callback Callback function
 */
utils.download = function(db, id, res, callback) {
  if (callback == null) {
    callback = (function() {});
  }

  return db.collection('fs.files').findOne({
    'metadata.mongo-storage': true,
    '_id': new ObjectID(id)
  }, function(err, file) {
    if (err) {
      return callback(err);
    }
    if (!file) {
      err = new Error('File not found');
      err.status = 404;
      return callback(err);
    }

    var gfs = Grid(db, mongodb);
    var read = gfs.createReadStream({
      _id: file._id
    });
    res.set('Content-Disposition', "attachment; filename=\"" + file.filename + "\"");
    res.set('Content-Type', file.metadata.mimetype);
    res.set('Content-Length', file.length);
    return read.pipe(res);
  });
};