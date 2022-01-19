/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

const fs = require('fs');
const _ = require('lodash');
const { expect } = require('chai');
const coXslt = require('../index');
const testData = require('./dataset/docObjects');

describe('doTheJob', () => {
  before(done => {
    coXslt.initialJob(() => {
      done();
    });
  });

  describe('Errors', () => {
    it('testData.noIdIstex returns an error', done => {
      coXslt.doTheJob(testData.noIdIstex, err => {
        expect(err).to.be.instanceOf(Error);
        done();
      });
    });

    it('testData.noCorpusOutput returns an error', done => {
      coXslt.doTheJob(testData.noCorpusOutput, err => {
        expect(err).to.be.instanceOf(Error);
        done();
      });
    });

    it('testData.noOriginalXml returns an error', done => {
      coXslt.doTheJob(testData.noOriginalXml, err => {
        expect(err).to.be.instanceOf(Error);
        done();
      });
    });

    it('testData.inexistantOriginalXml returns an error', done => {
      coXslt.doTheJob(testData.inexistantOriginalXml, err => {
        expect(err).to.be.instanceOf(Error);
        expect(err.name).to.be.equal('ApplyStylesheetError');
        done();
      });
    });
  });

  describe('Successes', () => {
    it('testData.crossref creates a correct TEI', done => {
      const docObject = testData.crossref;
      coXslt.doTheJob(docObject, err => {
        expect(err).to.be.undefined;

        const teiFile = _.find(docObject.metadata, { mime: 'application/tei+xml', original: false });
        expect(teiFile).to.not.be.undefined;
        expect(fs.existsSync(teiFile.path)).to.be.true;

        done();
      });
    });

    it('testData.hal creates a correct TEI', done => {
      const docObject = testData.hal;
      coXslt.doTheJob(docObject, err => {
        expect(err).to.be.undefined;

        const teiFile = _.find(docObject.metadata, { mime: 'application/tei+xml', original: false });
        expect(teiFile).to.not.be.undefined;
        expect(fs.existsSync(teiFile.path)).to.be.true;

        done();
      });
    });

    it('testData.pubmed creates a correct TEI', done => {
      const docObject = testData.pubmed;
      coXslt.doTheJob(docObject, err => {
        expect(err).to.be.undefined;

        const teiFile = _.find(docObject.metadata, { mime: 'application/tei+xml', original: false });
        expect(teiFile).to.not.be.undefined;
        expect(fs.existsSync(teiFile.path)).to.be.true;

        done();
      });
    });

    it('testData.sudocTheses creates a correct TEI', done => {
      const docObject = testData.sudocTheses;
      coXslt.doTheJob(docObject, err => {
        expect(err).to.be.undefined;

        const teiFile = _.find(docObject.metadata, { mime: 'application/tei+xml', original: false });
        expect(teiFile).to.not.be.undefined;
        expect(fs.existsSync(teiFile.path)).to.be.true;

        done();
      });
    });
  });
});
