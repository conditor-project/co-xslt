'use strict';
const Promise = require('bluebird');
const fse = require('fs-extra');
const path = require('path');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');
Promise.promisifyAll(Computron.prototype);

const coXslt = {};
coXslt.doTheJob = function (docObject, next) {
  if (!docObject.hasOwnProperty('originDocPath')) return next(new Error('no originDocPath key founded'));
  const filename = path.basename(docObject.originDocPath, '.xml');
  const directory = path.dirname(docObject.originDocPath);
  const teiDocDirectory = (directory[0] === '/') ? directory : path.join(__dirname, directory);
  const teiDocPath = path.join(teiDocDirectory, `${filename}.tei`);
  const transformer = new Computron();
  fse.ensureDir(teiDocDirectory)
    .then(() => getStylesheetFrom(docObject.source))
    .then(stylesheets => {
      if (stylesheets.length === 0) return Promise.reject(new Error(`no stylesheet founded for ${docObject.source}`));
      // FIXME : waiting a single xsl stylesheet for pubmed
      // if (stylesheets.length > 1) return Promise.reject(new Error(`more than one stylesheet founded for ${docObject.source}`));
      // const stylesheet = stylesheets.pop();
      const stylesheet = stylesheets[0];
      return transformer.loadStylesheetAsync(stylesheet.path);
    })
    .then(() => {
      const originDocPath = (docObject.originDocPath[0] === '/') ? docObject.originDocPath : path.join(__dirname, docObject.originDocPath);
      return transformer.applyAsync(originDocPath);
    })
    .then(xmlTei => fse.writeFile(teiDocPath, xmlTei))
    .then(() => {
      docObject.path = teiDocPath;
      docObject.teiDocPath = teiDocPath;
      next(null, docObject);
    })
    .catch(error => {
      docObject.error = error;
      next(error);
    });
};

module.exports = coXslt;
