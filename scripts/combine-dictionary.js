#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Load word arrays from each level file
const level0 = require('./words-level-0.js');
const level1 = require('./words-level-1.js');
const level2 = require('./words-level-2.js');
const level3 = require('./words-level-3.js');

const allWords = [...level0, ...level1, ...level2, ...level3];

// Validate
const VALID_POS = new Set([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'determiner',
  'interjection',
]);
const VALID_TAGS = new Set([
  'General',
  'IELTS',
  'Business',
  'Travel',
  'Reading',
  'Movies',
  'Academic',
  'Daily Life',
  'Technology',
  'Health',
]);

let errors = 0;
const seen = new Set();

for (const w of allWords) {
  if (!w.word) {
    console.error('Missing word field');
    errors++;
    continue;
  }
  const key = w.word.toLowerCase();
  if (seen.has(key)) {
    console.error(`Duplicate: ${w.word}`);
    errors++;
  }
  seen.add(key);

  if (!VALID_POS.has(w.partOfSpeech)) {
    console.error(`Invalid POS for ${w.word}: ${w.partOfSpeech}`);
    errors++;
  }
  if (![0, 1, 2, 3].includes(w.difficultyLevel)) {
    console.error(`Invalid level for ${w.word}: ${w.difficultyLevel}`);
    errors++;
  }
  if (!Array.isArray(w.topicTags) || w.topicTags.length === 0) {
    console.error(`Missing tags for ${w.word}`);
    errors++;
  }
  for (const t of w.topicTags || []) {
    if (!VALID_TAGS.has(t)) {
      console.error(`Invalid tag for ${w.word}: ${t}`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} validation errors found. Proceeding anyway...`);
}

// Distribution
const dist = [0, 0, 0, 0];
for (const w of allWords) dist[w.difficultyLevel]++;
console.log(
  `Level distribution: Beginner=${dist[0]} Pre-Int=${dist[1]} Int=${dist[2]} Upper-Int=${dist[3]}`
);

// Deduplicate (keep first occurrence)
const uniqueWords = [];
const uniqueSeen = new Set();
for (const w of allWords) {
  const key = w.word.toLowerCase();
  if (!uniqueSeen.has(key)) {
    uniqueSeen.add(key);
    uniqueWords.push(w);
  }
}
console.log(
  `Total after dedup: ${uniqueWords.length} (removed ${allWords.length - uniqueWords.length} duplicates)`
);

// Write output
const outDir = path.resolve(__dirname, '..', 'assets', 'dictionary');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'base-5000.json');
fs.writeFileSync(outPath, JSON.stringify(uniqueWords, null, 2), 'utf-8');

const mb = (fs.statSync(outPath).size / 1048576).toFixed(2);
console.log(`Output: ${uniqueWords.length} words | ${mb}MB | ${outPath}`);
