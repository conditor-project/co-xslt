/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const coXslt = require('..');
const { expect } = require('chai');

const SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler('crash.log');

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

for (let i = 0; i < directories.length; i++) {
  const directory = directories[i];
  const dir = path.resolve(rootDir, directory);
  const dirStats = fs.statSync(dir);
  if (dirStats.isDirectory()) {
    const files = fs.readdirSync(dir);
    for (let j = 0; j < files.length; j++) {
      const file = files[j];
      const filePath = path.resolve(dir, file);
      const fileStats = fs.statSync(filePath);
      if (fileStats.isFile() && file.indexOf('.xml') > -1) {
        const docObject = buildDocObject(directory, filePath, dir);
        typeof docObjects[docObject.source] !== 'undefined' && Array.isArray(docObjects[docObject.source])
          ? docObjects[docObject.source].push(docObject)
          : (docObjects[docObject.source] = [docObject]);
      }
    }
  }
}

describe(pkg.name + '/index.js', function () {
  describe('doTheJob', function () {
    for (const source in docObjects) {
      describe('Source : ' + source, function () {
        for (let i = 0; i < docObjects[source].length; i++) {
          it(
            'test on ' +
              docObjects[source][i].originDocPath.substring(docObjects[source][i].corpusRoot.length + 1) +
              ' should pass',
            function (done) {
              coXslt.doTheJob(docObjects[source][i], function (error, docObject) {
                if (error) {
                  console.log(error);
                  return done(error);
                }
                expect(docObject).to.have.own.property('teiDocPath');
                const teiExists = fs.existsSync(docObject.teiDocPath);
                expect(teiExists).to.be.true;
                if (fs.statSync(docObject.teiDocPath).isFile()) fs.unlinkSync(docObject.teiDocPath);
                return done();
              });
            }
          );
        }
      });
    }
  });
});
