'use strict';
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const fs = require('fs');
const pkg = require('../package.json');
const coXslt = require('..');
const expect = require('chai').expect;
const docObjectInput = require('./dataset/inputDoc.json');

describe(pkg.name + '/index.js', function () {
  describe('doTheJob', function () {
    it('should do the job and do it well', function (done) {
      coXslt.doTheJob(docObjectInput, (error, docObject) => {
        if (error) return done(error);
        expect(docObject).to.have.own.property('teiDocPath');
        const teiExists = fs.existsSync(docObject.teiDocPath);
        expect(teiExists).to.be.true;
        done();
      });
    });

    after(function () {
      fs.unlinkSync(docObjectInput.teiDocPath);
    });
  });
});
