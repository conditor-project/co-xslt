const fs = require('fs-extra');
const path = require('path');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');

const coXslt = {};
coXslt.doTheJob = function (docObject, callback) {
  if (!docObject.originDocPath) return callback(new Error('no originDocPath key founded'));
  const filename = path.basename(docObject.originDocPath, '.xml');
  const directory = path.dirname(docObject.originDocPath);
  const teiDocDirectory = (directory[0] === '/') ? directory : path.join(__dirname, directory);
  const teiDocPath = path.join(teiDocDirectory, `${filename}.tei`);
  const transformer = new Computron();
  fs.ensureDir(teiDocDirectory)
    .then(() => getStylesheetFrom(docObject.source))
    .then(stylesheets => {
      if (stylesheets.length === 0) return Promise.reject(new Error(`no stylesheet founded for ${docObject.source}`));
      // FIXME : waiting a single xsl stylesheet for pubmed
      // if (stylesheets.length > 1) return Promise.reject(new Error(`more than one stylesheet founded for ${docObject.source}`));
      // const stylesheet = stylesheets.pop();
      const stylesheet = stylesheets[0];

      return new Promise((resolve, reject) => {
        transformer.loadStylesheet(stylesheet.path, err => err ? reject(err) : resolve());
      });
    })
    .then(() => {
      const originDocPath = (docObject.originDocPath[0] === '/') ? docObject.originDocPath : path.join(__dirname, docObject.originDocPath);
      const conf = typeof coXslt.config !== 'undefined' ? coXslt.config : {};
      if (typeof conf.today === 'undefined') conf.today = today();

      return new Promise((resolve, reject) => {
        transformer.apply(originDocPath, conf, (err, result) => err ? reject(err) : resolve(result));
      });
    })
    .then(xmlTei => fs.writeFile(teiDocPath, xmlTei))
    .then(() => {
      docObject.path = teiDocPath;
      docObject.teiDocPath = teiDocPath;
      callback(null, docObject);
    })
    .catch(error => {
      docObject.error = error;
      callback(error);
    });
};

function today () {
  const date = new Date();
  let dd = date.getDate();
  let mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();

  if (dd < 10) dd = '0' + dd;

  if (mm < 10) mm = '0' + mm;

  return yyyy + '/' + mm + '/' + dd;
}

module.exports = coXslt;
