const fs = require('fs-extra');
const path = require('path');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');
const _ = require('lodash');

const coXslt = {};
coXslt.doTheJob = (docObject, callback) => {
  if (!docObject.idIstex) {
    return callback(handleError(docObject, 'NoIdIstexError', new Error('No idIstex found in docObject')));
  }

  if (!docObject.corpusOutput) {
    return callback(handleError(docObject, 'NoCorpusOutputError', new Error('No corpusOutput found in docObject')));
  }

  const originalXmlFile = _.find(docObject.metadata, { mime: 'application/xml', original: true });
  if (!originalXmlFile) {
    return callback(handleError(docObject, 'NoOriginalXmlError', new Error('No original XML found in metadata array')));
  }

  const { idIstex } = docObject;
  const teiDocDirectory = path.join(docObject.corpusOutput, idIstex[0], idIstex[1], idIstex[2], idIstex, 'metadata');
  const teiDocPath = path.join(teiDocDirectory, `${idIstex}.tei.xml`);
  const transformer = new Computron();

  // If docObject.source is undefined, set it to what is after 'conditor:' in docObject.cartoType
  if (!docObject.source && docObject.cartoType.startsWith('conditor:')) {
    docObject.source = docObject.cartoType.substring(9);
  }

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
      const conf = coXslt.config ? coXslt.config : {};
      if (!conf.today) conf.today = today();

      return new Promise((resolve, reject) => {
        transformer.apply(originalXmlFile.path, conf, (err, result) => err ? reject(handleError(docObject, 'ApplyStylesheetError', err)) : resolve(result));
      });
    })
    .then(xmlTei => {
      return new Promise((resolve, reject) => {
        fs.writeFile(teiDocPath, xmlTei)
          .then(() => resolve())
          .catch(err => reject(handleError(docObject, 'WriteFileError', err)));
      });
    })
    .then(() => {
      docObject.metadata.push({
        path: teiDocPath,
        mime: 'application/tei+xml',
        original: false,
      });

      docObject.path = teiDocPath;

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
