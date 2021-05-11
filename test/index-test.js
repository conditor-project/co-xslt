/*
 * @prettier
 */

"use strict";
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const coXslt = require("..");
const async = require("async");
const expect = require("chai").expect;

const SegfaultHandler = require("segfault-handler");
SegfaultHandler.registerHandler("crash.log");

function buildDocObject(source, originDocPath, corpusRoot) {
  return {
    corpusRoot: corpusRoot,
    ingest: {
      path: "no.zip",
      type: "zip",
      sessionName: "TEST-11223344"
    },
    source: source,
    id: 666,
    originDocPath: originDocPath,
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
              docObjects[source][i].originDocPath.substring(docObjects[source][i].corpusRoot.length + 1) +
              " should pass",
            function (done) {
              coXslt.doTheJob(docObjects[source][i], function (error, docObject) {
                if (error) {
                  console.log(error);
                  return done(error);
                }
                expect(docObject).to.have.own.property("teiDocPath");
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
