'use strict';
const fse = require('fs-extra');
const path = require('path');
const SaxonJS = require('saxon-js');
const { getSefFrom } = require('tei-conditor');

const coXslt = {};
coXslt.doTheJob = function (docObject, next) {
  if (!docObject.hasOwnProperty('originDocPath')) return next(new Error('no originDocPath key founded'));
  const filename = path.basename(docObject.originDocPath, '.xml');
  const directory = path.dirname(docObject.originDocPath);
  const teiDocDirectory = (directory[0] === '/') ? directory : path.join(__dirname, directory);
  const teiDocPath = path.join(teiDocDirectory, `${filename}.tei`);
  fse.ensureDir(teiDocDirectory)
    .then(() => getSefFrom(docObject.source))
    .then(stylesheets => {
      if (stylesheets.length === 0) return Promise.reject(new Error(`no stylesheet founded for ${docObject.source}`));
      // FIXME : waiting a single xsl stylesheet for pubmed
      // if (stylesheets.length > 1) return Promise.reject(new Error(`more than one stylesheet founded for ${docObject.source}`));
      // const stylesheet = stylesheets.pop();
      const stylesheet = stylesheets[0];
      const originDocPath = (docObject.originDocPath[0] === '/') ? docObject.originDocPath : path.join(__dirname, docObject.originDocPath);
      let conf = typeof coXslt.config !== "undefined" ? coXslt.config : {};
      if (typeof conf.today === "undefined") conf.today = today();
      
      SaxonJS.transform({
        stylesheetFileName: stylesheet,
        sourceFileName: originDocPath,
        destination: "serialized"
      }, "async");
    }).then(output => {
        fse.writeFile(teiDocPath, output.principalResult);
    })
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
