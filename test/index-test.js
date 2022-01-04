/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');
const coXslt = require('..');
const { expect } = require('chai');

function buildDocObject (source, originDocPath, corpusRoot) {
  return {
    corpusRoot: corpusRoot,
    ingest: {
      path: 'no.zip',
      type: 'zip',
      sessionName: 'TEST-11223344',
    },
    source: source,
    id: 666,
    originDocPath: originDocPath,
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
        it(`Test on ${path.basename(docObject.originDocPath)} should pass`, (done) => {
          coXslt.doTheJob(docObject, error => {
            expect(error).to.be.undefined;
            expect(docObject.teiDocPath).to.not.be.undefined;

            const teiExists = fs.existsSync(docObject.teiDocPath);
            expect(teiExists).to.be.true;

            if (teiExists) fs.unlinkSync(docObject.teiDocPath);

            done();
          });
        });
      }
    });
  }
});
