/* global hexo */

'use strict';

let MoeMark = require('moemark');
let util = require('hexo-util');
let assign = require('object-assign');
let stripIndent = require('strip-indent');
let katex = require('katex');
let mj = require('mathjax-node');
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

let cache = {
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

let MoeMarkRenderer = MoeMark.Renderer;
function Renderer() {
  MoeMarkRenderer.apply(this);

  this._headingId = {};
}

require('util').inherits(Renderer, MoeMarkRenderer);

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

let cacheOption = {
    highlight: true,
    math: true,
    result: true
}

let render = function (data, options, cb) {
    let mathCnt = 0,
        maths = new Array(),
        res, finished = false;
    if (cacheOption.result) {
        let x = cache.get('RES_' + data.text);
        if (x !== undefined) cb(null, x);
    }

    MoeMark.setOptions({
        lineNumber: false,
        math: true,
        highlight: function(code, lang) {
            if (cacheOption.highlight) {
                let x = cache.get('H_' + lang + '_' + code);
                if (x !== undefined) return x;
            }
            let res = util.highlight(stripIndent(code), {
                lang: lang,
                gutter: false,
                wrap: false
            });
            if (cacheOption.highlight) cache.set('H_' + lang + '_' + code, res);
            return res;
        },
        mathRenderer: function(str, display) {
            if (cacheOption.math) {
                let x = cache.get('M_' + display + '_' + str);
                if (x !== undefined) return x;
            }
            try {
                let res = katex.renderToString(str, {
                    displayMode: display
                });
                if (cacheOption.math) cache.set('M_' + display + '_' + str, res);
                return res;
            } catch (e) {
                const id = mathCnt;
                mathCnt++;
                mj.typeset({
                    math: str,
                    format: display ? 'TeX' : 'inline-TeX',
                    svg: true,
                    width: 0
                }, function(data) {
                    if (data.errors) maths[id] = '<div style="display: inline-block; border: 1px solid #000; "><strong>' + data.errors.toString() + '</strong></div>';
                    else if (display) maths[id] = '<div style="text-align: center; ">' + data.svg + '</div>';
                    else maths[id] = data.svg;
                    if (cacheOption.math) cache.set('M_' + display + '_' + str, maths[id]);
                    if (!--mathCnt) finish();
                });

                return '<span id="math-' + id + '"></span>';
            }
        }
    });

    function finish() {
        if (finished) return;
        finished = true;
        if (maths.length) {
            let x = require('jsdom').jsdom().createElement('div');
            x.innerHTML = res;
            for (let i = 0; i < maths.length; i++) {
                x.querySelector('#math-' + i).outerHTML = maths[i];
            }
            res = x.innerHTML;
        }
        if (cacheOption.result) cache.set('RES_' + data.text, res);
        cb(null, res);
    }

    try {
        res = MoeMark(data.text, assign({
          renderer: new Renderer()
        }, this.config.moemark, options));

        if (mathCnt == 0) {
            finish();
        }
    } catch (e) {
        cb(e, null);
    }
};

module.exports = render;
