/*
 * @prettier
 */

"use strict";
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const fs = require("fs");
const sha1 = require("sha1");
const path = require("path");
const pkg = require("../package.json");
const coXslt = require("..");
const expect = require("chai").expect;

const SegfaultHandler = require("segfault-handler");
SegfaultHandler.registerHandler("crash.log");

function buildDocObject(source, originDocPath, corpusRoot) {
  return {
    idIstex: sha1(originDocPath).toUpperCase(),
    source: source,
    corpusRoot: corpusRoot,
    corpusName: "test",
    cartoType: "conditor",
    corpusOutput: path.resolve(__dirname, "corpusOutput"),
    metadata: [{
      path: originDocPath,
      mime: "application/xml",
      original: true
    }],
    fulltext: [],
    sessionName: "NO-ID"
  };
}

let docObjects = {};

let rootDir = path.resolve(__dirname, "dataset/"),
  directories = fs.readdirSync(rootDir);

for (let i = 0; i < directories.length; i++) {
  let directory = directories[i],
    dir = path.resolve(rootDir, directory),
    dirStats = fs.statSync(dir);
  if (dirStats.isDirectory()) {
    let files = fs.readdirSync(dir);
    for (let j = 0; j < files.length; j++) {
      let file = files[j],
        filePath = path.resolve(dir, file),
        fileStats = fs.statSync(filePath);
      if (fileStats.isFile() && file.indexOf(".xml") > -1) {
        let docObject = buildDocObject(directory, filePath, dir);
        typeof docObjects[docObject.source] !== "undefined" && Array.isArray(docObjects[docObject.source])
          ? docObjects[docObject.source].push(docObject)
          : (docObjects[docObject.source] = [docObject]);
      }
    }
  }
}

describe(pkg.name + "/index.js", function () {
  describe("doTheJob", function () {
    for (let source in docObjects) {
      describe("Source : " + source, function () {
        for (let i = 0; i < docObjects[source].length; i++) {
          it(
            "test on " +
              docObjects[source][i].metadata[0].path.substring(docObjects[source][i].corpusRoot.length + 1) +
              " should pass",
            function (done) {
              coXslt.doTheJob(docObjects[source][i], function (error, docObject) {
                if (error) {
                  console.log(error);
                  return done(error);
                }

                const teiFile = coXslt.getIstexFile(docObject.metadata, {
                  mime: 'application/tei+xml',
                  original: false
                });
              

                expect(teiFile).to.be.not.null;
                expect(teiFile).to.be.an("object");
                expect(teiFile.path.endsWith("tei.xml")).to.be.true;
                expect(teiFile.mime).to.be.equal("application/tei+xml");
                expect(teiFile.original).to.be.false;
                const teiExists = fs.existsSync(teiFile.path);
                expect(teiExists).to.be.true;
               if (fs.statSync(teiFile.path).isFile()) fs.unlinkSync(teiFile.path);
                return done();
              });
            }
          );
        }
      });
    }
  });
});
