const fs = require('fs-extra');
const path = require('path');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');

const coXslt = {};
coXslt.doTheJob = (docObject, callback) => {
  if (!docObject.originDocPath) {
    return callback(handleError(docObject, 'NoOriginDocPathError', new Error('No originDocPath key found in docObject')));
  }

  const filename = path.basename(docObject.originDocPath, '.xml');
  const directory = path.dirname(docObject.originDocPath);
  const teiDocDirectory = path.isAbsolute(directory) ? directory : path.join(__dirname, directory);
  const teiDocPath = path.join(teiDocDirectory, `${filename}.tei`);
  const transformer = new Computron();

  fs.ensureDir(teiDocDirectory)
    .then(() => getStylesheetFrom(docObject.source))
    .then(stylesheets => {
      if (stylesheets.length === 0) {
        return Promise.reject(handleError(docObject, 'NoStylesheetError', new Error(`No stylesheet found for ${docObject.source}`)));
      }

      if (docObject.source === 'pubmed' && stylesheets.length > 1) {
        return Promise.reject(handleError(docObject, 'MultiplePubmedStylesheetsError', new Error('More than one stylesheet found for Pubmed')));
      }

      const stylesheet = stylesheets.pop();

      return new Promise((resolve, reject) => {
        transformer.loadStylesheet(stylesheet.path, err => err ? reject(handleError(docObject, 'LoadStylesheetError', err)) : resolve());
      });
    })
    .then(() => {
      const originDocPath = path.isAbsolute(docObject.originDocPath) ? docObject.originDocPath : path.join(__dirname, docObject.originDocPath);
      const conf = coXslt.config ? coXslt.config : {};
      if (!conf.today) conf.today = today();

      return new Promise((resolve, reject) => {
        transformer.apply(originDocPath, conf, (err, result) => err ? reject(handleError(docObject, 'ApplyStylesheetError', err)) : resolve(result));
      });
    })
    .then(xmlTei => fs.writeFile(teiDocPath, xmlTei))
    .then(() => {
      docObject.path = teiDocPath;
      docObject.teiDocPath = teiDocPath;

      callback();
    })
    .catch(callback);
};

function handleError (docObject, errName, originalErr) {
  docObject.errCode = errName;
  docObject.errMsg = originalErr.message;

  originalErr.name = errName;

  return originalErr;
}

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
