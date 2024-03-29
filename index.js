const fs = require('fs-extra');
const path = require('path');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');
const _ = require('lodash');

const computronInstances = [];
const coXslt = {};

coXslt.initialJob = callback => {
  const possibleSources = [
    'crossref',
    'hal',
    'pubmed',
    'sudoc-ouvrages',
    'sudoc-theses',
  ];
  const promises = [];

  possibleSources.forEach(source => {
    promises.push(getStylesheetFrom(source)
      .then(stylesheets => {
        return new Promise((resolve, reject) => {
          if (stylesheets.length === 0) {
            return reject(new Error(`No stylesheet found for ${source}`));
          }

          if (stylesheets.length > 1) {
            return reject(new Error('More than one stylesheet found'));
          }

          const computronInstance = new Computron();
          const stylesheet = stylesheets.pop();

          try {
            computronInstance.loadStylesheet(stylesheet.path);
          } catch (err) {
            return reject(err);
          }

          computronInstances.push({
            name: source,
            instance: computronInstance,
          });

          resolve();
        });
      }),
    );
  });

  Promise.all(promises).then(() => callback()).catch(callback);
};

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

  // If docObject.source is undefined, set it to what is after 'conditor:' in docObject.cartoType
  if (!docObject.source && docObject.cartoType.startsWith('conditor:')) {
    docObject.source = docObject.cartoType.substring(9);
  } else if (!docObject.source && docObject.cartoType.startsWith('corhal:')) {
    docObject.source = docObject.cartoType.substring(7);
  }

  const { idIstex } = docObject;
  const teiDocDirectory = path.join(docObject.corpusOutput, idIstex[0], idIstex[1], idIstex[2], idIstex, 'metadata');
  const teiDocPath = path.join(teiDocDirectory, `${idIstex}.tei.xml`);
  let transformer = computronInstances.find(element => element.name === docObject.source);

  if (!transformer) {
    return callback(handleError(docObject, 'NoComputronInstanceError', new Error(`No Computron instance found for ${docObject.source}`)));
  }

  transformer = transformer.instance;

  fs.ensureDir(teiDocDirectory)
    .then(() => {
      const conf = coXslt.config ? coXslt.config : {};
      if (!conf.today) conf.today = today();

      return new Promise((resolve, reject) => {
        try {
          const result = transformer.apply(originalXmlFile.path, conf);
          resolve(result);
        } catch (err) {
          reject(handleError(docObject, 'ApplyStylesheetError', err));
        }
      });
    })
    .then(xmlTei => {
      return new Promise((resolve, reject) => {
        fs.writeFile(teiDocPath, xmlTei, 'utf-8')
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
