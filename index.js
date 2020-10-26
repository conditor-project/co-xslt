'use strict';
const Promise = require('bluebird');
const fse = require('fs-extra');
const path = require('path');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');
const utils = require('li-utils');
Promise.promisifyAll(Computron.prototype);

const coXslt = {};

coXslt.doTheJob = function (docObject, next) {
  
  const originalXmlFile = utils.files.get(docObject.metadata, {
    mime: 'application/xml',
    original: true
  });
  
  if (!originalXmlFile) return next(new Error('no xml original file found in metadata array.'));
  const originalXmlPath = originalXmlFile.path;
  const filename = path.basename(originalXmlPath, '.xml');
  if (!docObject.idIstex) return next(new Error('docObject has no idIstex.'));
  if (!docObject.corpusOutput) return next(new Error('docObject has no corpusOutput.'));
  const upperCaseIdIstex = docObject.idIstex.toUpperCase();
  const teiDocDirectory = path.join(docObject.corpusOutput,upperCaseIdIstex[0],upperCaseIdIstex[1],upperCaseIdIstex[2],upperCaseIdIstex, 'metadata');
  const teiDocPath = path.join(teiDocDirectory, `${upperCaseIdIstex}.tei.xml`);
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
      const originDocPath = (originalXmlPath[0] === '/') ? originalXmlPath : path.join(__dirname, originalXmlPath);
      let conf = typeof coXslt.config !== "undefined" ? coXslt.config : {};
      if (typeof conf.today === "undefined") conf.today = today();
      return transformer.applyAsync(originDocPath, conf);
    })
    .then(xmlTei => fse.writeFile(teiDocPath, xmlTei))
    .then(() => {
      docObject.metadata.push({
        path: teiDocPath,
        mime: "application/tei+xml",
        original: false
      });
      next(null, docObject);
    })
    .catch(error => {
      docObject.error = error;
      next(error);
    });
};

function today() {
  let date = new Date(),
    dd = date.getDate(),
    mm = date.getMonth()+1,
    yyyy = date.getFullYear();

  if(dd<10) {
    dd='0'+dd;
  }

  if(mm<10) {
    mm='0'+mm;
  }
  return yyyy+'/'+mm+'/'+dd;
}

module.exports = coXslt;
