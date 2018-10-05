'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');
Promise.promisifyAll(Computron.prototype);

const coXslt = {};
coXslt.doTheJob = function (docObject, next) {
  if (docObject.hasOwnProperty('originDocPath')) return next(new Error('no originDocPath key founded'));
  const transformer = new Computron();
  getStylesheetFrom(docObject.source).then(stylesheets => {
    if (stylesheets.length === 0) return Promise.reject(new Error(`no stylesheet founded for ${docObject.source}`));
    if (stylesheets.length > 1) return Promise.reject(new Error(`more than one stylesheet founded for ${docObject.source}`));
    const stylesheet = stylesheets.pop();
    return transformer.loadStylesheetAsync(stylesheet.path);
  }).then(() => transformer.applyAsync(docObject.sourcePath))
    .then(xmlTei => {
      const name = path.basename(docObject.originDocPath);
      docObject.teiDocPath = path.join(docObject.corpusRoot, 'tei', name);
      return fs.writeFileAsync(docObject.teiDocPath, xmlTei);
    })
    .then(() => next(null, docObject))
    .catch(next);
};

module.exports = coXslt;
