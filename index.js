'use strict';
const Promise = require('bluebird');
const fse = require('fs-extra');
const path = require('path');
const fs = require('fs');
const Computron = require('computron');
const { getStylesheetFrom } = require('tei-conditor');
Promise.promisifyAll(Computron.prototype);

const coXslt = {};

coXslt.doTheJob = function (docObject, next) {
  if (!docObject.metadata || docObject.metadata===0) {
    docObject.error = {code:15,message:'At least one metadata file should be present.'};
    return next(docObject.error);
  }

  const originalXmlFile = this.getIstexFile(docObject.metadata, {
    mime: 'application/xml',
    original: true
  });
  
  if (!originalXmlFile) {
    docObject.error = {code:14,message:'no xml original file found in metadata array.'};
    return next(docObject.error);
  }
  const originalXmlPath = originalXmlFile.path;
  if (fs.statSync(originalXmlPath).size <=0) {
    docObject.error = {code:11,message:'input file '+ originalXmlPath +'is empty'};
    return next(docObject.error);
  }
  if (!docObject.idIstex) {
    docObject.error = {code:12,message:'docObject has no idIstex.'};
    return next(docObject.error);
  }
  if (!docObject.corpusOutput) {
    docObject.error = {code:13,message:'docObject has no corpusOutput.'};
    return next(docObject.error);
  }
  const upperCaseIdIstex = docObject.idIstex.toUpperCase();
  const teiDocDirectory = path.join(docObject.corpusOutput,upperCaseIdIstex[0],upperCaseIdIstex[1],upperCaseIdIstex[2],upperCaseIdIstex, 'metadata');
  const teiDocPath = path.join(teiDocDirectory, `${upperCaseIdIstex}.tei.xml`);
  const transformer = new Computron();
  let source = (docObject.source) ? docObject.source : undefined;
  if (!source && docObject.cartoType.startsWith("conditor:")) source = docObject.cartoType.substring(9);
  fse.ensureDir(teiDocDirectory)
    .then(() => getStylesheetFrom(source))
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
      docObject.error = {code:10,message:error.message};
      next({code:10,message:error.message});
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

 
/**
 * Retourne le premier objet du Tableau de fichier respectant tous les critères spécifiées
 * Exemple : Je souhaite récupérer le fichier txt généré par LoadIstex
 *   files = docObject.fulltext (paramètre du docObject contenant les infos liées au fulltext)
 *   criteria = { mime: 'text/plain', original: false }, --> ficher txt généré par LoadIstex
 * @param {array} files Tableau d'objet représentant un ensemble de fichier (ex : jsonLine.metadata || jsonLine.fulltext)
 * @param {object} criteria Objet regroupant les critères du document recherché
 * @return {object} L'objet correspondant ou null
 */
coXslt.getIstexFile = function(files, criteria) {
  var keys = Object.keys(criteria);
  for (var i = 0; i < files.length; i++) {
    var found = true;
    for (var j = 0; j < keys.length; j++) {
      found &= (criteria[keys[j]] instanceof RegExp) ? criteria[keys[j]].test(files[i][keys[j]]) : (files[i][keys[j]] === criteria[keys[j]]);
      if (!found) break;
    }
    if (found) return files[i];
  }
  return null;
};

module.exports = coXslt;
