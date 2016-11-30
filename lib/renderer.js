/* global hexo */

'use strict';

let renderer = require('moemark-renderer');
let util = require('hexo-util');
let assign = require('object-assign');
let stripIndent = require('strip-indent');
let katex = require('katex');
let mj = require('mathjax-node');
let pygmentize = require('pygmentize-bundled-cached');
let hexo = global._hexo;

let hexoCacheData = null, hexoCacheFile = null;
if (hexoCacheData === null) {
  let fs = require('fs'), path = require('path');
  hexoCacheFile = path.resolve(hexo.base_dir, 'cache.json');
  try {
    hexoCacheData = JSON.parse(fs.readFileSync(hexoCacheFile));
  } catch (e) {
    hexoCacheData = {};
  }
}

renderer.cache = {
  get(key) {
    return hexoCacheData[key];
  },
  set(key, val) {
    hexoCacheData[key] = val;
  }
};

process.on('exit', () => {
  let fs = require('fs'), path = require('path');
  fs.writeFileSync(path.resolve(hexo.base_dir, 'cache.json'), JSON.stringify(hexoCacheData));
});

let OldRenderer = renderer.moemark.Renderer;
function Renderer() {
  OldRenderer.apply(this);

  this._headingId = {};
}

require('util').inherits(Renderer, OldRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function (text, level) {
  if (typeof this._headingId === 'undefined') this._headingId = {};
  var id = anchorId(util.stripHTML(text));
  var headingId = this._headingId;

  // Add a number after id if repeated
  if (headingId[id]) {
    id += '-' + headingId[id]++;
  } else {
    headingId[id] = 1;
  }
  // add headerlink
  return '<h' + level + ' id="' + id + '"><a href="#' + id + '" class="headerlink" title="' + util.stripHTML(text) + '"></a>' + text + '</h' + level + '>';
};

function anchorId(str) {
  return util.slugize(str.trim());
}

renderer.cacheOption = {
  highlight: true,
  math: true,
  result: true
};

function escapeHTML(s) {
  // Code from http://stackoverflow.com/questions/5251520/how-do-i-escape-some-html-in-javascript/5251551
  return s.replace(/[^0-9A-Za-z ]/g, (c) => {
    return "&#" + c.charCodeAt(0) + ";";
  });
}

renderer.config.highlight = (code, lang, cb) => {
  code = code.split('\t').join('    ');
  pygmentize({
    lang: lang,
    format: 'html',
    options: {
    nowrap: true,
    classprefix: 'pl-'
    }
  }, code, (err, res) => {
    if (err) {
      cb(escapeHTML(code));
    } else {
      cb(res);
    }
  });
}

module.exports = function (data, options, cb) {
  renderer(data.text, assign({
    renderer: new Renderer()
  }, this.config.moemark, options), res => {
    cb(null, res);
  });
};
