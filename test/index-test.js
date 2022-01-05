/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

const fs = require('fs');
const sha1 = require('sha1');
const path = require('path');
const _ = require('lodash');
const coXslt = require('..');
const { expect } = require('chai');

function buildDocObject (source, originDocPath, corpusRoot) {
  return {
    idIstex: sha1(originDocPath).toUpperCase(),
    source: source,
    corpusRoot: corpusRoot,
    corpusName: 'test',
    cartoType: 'conditor',
    corpusOutput: path.join(__dirname, 'out'),
    metadata: [
      {
        path: originDocPath,
        mime: 'application/xml',
        original: true,
      },
    ],
    fulltext: [],
    sessionName: 'NO-ID',
  };
}

const docObjects = {};

const rootDir = path.resolve(__dirname, 'dataset/');
const directories = fs.readdirSync(rootDir);

for (const directory of directories) {
  const dir = path.resolve(rootDir, directory);
  const dirStats = fs.statSync(dir);
  if (dirStats.isDirectory()) {
    const files = fs.readdirSync(dir);
    for (const filename of files) {
      const filePath = path.resolve(dir, filename);
      const fileStats = fs.statSync(filePath);
      if (fileStats.isFile() && path.extname(filename) === '.xml') {
        const docObject = buildDocObject(directory, filePath, dir);
        Array.isArray(docObjects[docObject.source]) ? docObjects[docObject.source].push(docObject) : (docObjects[docObject.source] = [docObject]);
      }
    }
  }
}

describe('doTheJob', () => {
  for (const source in docObjects) {
    describe('Source: ' + source, () => {
      for (const docObject of docObjects[source]) {
        it(`Test on ${path.basename(docObject.metadata[0].path)} should pass`, (done) => {
          coXslt.doTheJob(docObject, err => {
            expect(err).to.be.undefined;

            const teiFile = _.find(docObject.metadata, { mime: 'application/tei+xml', original: false });
            expect([null, undefined]).to.not.include(teiFile);

            const teiExists = fs.existsSync(teiFile.path);
            expect(teiExists).to.be.true;

            done();
          });
        });
      }
    });
  }
});
