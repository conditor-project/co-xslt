const path = require('path');

const noIdIstex = {};

const noCorpusOutput = {
  idIstex: '0000',
};

const noOriginalXml = {
  idIstex: '0000',
  corpusOutput: path.join(__dirname, '..', 'out'),
};

const inexistantOriginalXml = {
  idIstex: '0000',
  source: 'crossref',
  corpusOutput: path.join(__dirname, '..', 'out'),
  metadata: [
    {
      path: path.join(__dirname, 'crossref', 'inexistant.xml'),
      mime: 'application/xml',
      original: true,
    },
  ],
};

const crossref = {
  idIstex: '0000',
  source: 'crossref',
  corpusOutput: path.join(__dirname, '..', 'out'),
  metadata: [
    {
      path: path.join(__dirname, 'crossref', 'correct.xml'),
      mime: 'application/xml',
      original: true,
    },
  ],
};

const hal = {
  idIstex: '0001',
  source: 'hal',
  corpusOutput: path.join(__dirname, '..', 'out'),
  metadata: [
    {
      path: path.join(__dirname, 'hal', 'correct.xml'),
      mime: 'application/xml',
      original: true,
    },
  ],
};

const pubmed = {
  idIstex: '0002',
  source: 'pubmed',
  corpusOutput: path.join(__dirname, '..', 'out'),
  metadata: [
    {
      path: path.join(__dirname, 'pubmed', 'correct.xml'),
      mime: 'application/xml',
      original: true,
    },
  ],
};

const sudocTheses = {
  idIstex: '0003',
  source: 'sudoc-theses',
  corpusOutput: path.join(__dirname, '..', 'out'),
  metadata: [
    {
      path: path.join(__dirname, 'sudoc-theses', 'correct.xml'),
      mime: 'application/xml',
      original: true,
    },
  ],
};

module.exports = {
  noIdIstex,
  noCorpusOutput,
  noOriginalXml,
  inexistantOriginalXml,
  crossref,
  hal,
  pubmed,
  sudocTheses,
};
