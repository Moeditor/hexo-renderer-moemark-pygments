/* global hexo */

'use strict';

var renderer = require('./lib/renderer');

hexo.extend.renderer.register('md', 'html', renderer);
hexo.extend.renderer.register('markdown', 'html', renderer);
hexo.extend.renderer.register('mkd', 'html', renderer);
hexo.extend.renderer.register('mkdn', 'html', renderer);
hexo.extend.renderer.register('mdwn', 'html', renderer);
hexo.extend.renderer.register('mdtxt', 'html', renderer);
hexo.extend.renderer.register('mdtext', 'html', renderer);
