'use strict';

let renderer = require('moemark-renderer');

module.exports = (data, options, cb) => {
  // console.log(data);
  renderer(data.text, (res) => {
     cb(null, res);
     // console.log(res);
  });
};
