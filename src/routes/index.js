/* eslint-disable */

const express = require('express');
const fs = require('fs');
const Path = require('path');

const router = express.Router();
const importCache = {};

module.exports = function (app, http) {
  function customImport(path) {
    // is it a relative path?
    if (Path.normalize(path) !== Path.resolve(path)) {
      // make path relative to the caller
      const callerFilename = Utils.stack()[1].getFileName();
      const callerPath = Path.dirname(callerFilename);

      path = Path.resolve(callerPath, path);
    }

    if (!importCache[path]) {
      let defineCall = arguments.length > 1 ? arguments[1] : require(path);
      if (typeof defineCall === 'object') {
        // ES6 module compatability
        defineCall = defineCall.default;
      }
      importCache[path] = defineCall(router, app, http);
    }

    return importCache[path];
  }

  fs
    .readdirSync(__dirname)
    .filter((file) => {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach((file) => {
      customImport(Path.join(__dirname, file));
    });

  return router;
};
