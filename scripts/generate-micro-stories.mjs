#!/usr/bin/env node
/**
 * Generate micro-stories JSON from word-families.json.
 * Each story uses 2-3 family members in a short sentence.
 * startIndex/endIndex are computed programmatically to guarantee correctness.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const familiesPath = join(__dirname, '../assets/dictionary/word-families.json');
const outputPath = join(__dirname, '../assets/dictionary/micro-stories.json');

const families = JSON.parse(readFileSync(familiesPath, 'utf-8'));

// Simple definitions for common words (fallback used when needed)
const simpleDefs = {
  noun: 'a thing or concept',
  verb: 'an action or state',
  adjective: 'describes a quality',
  adverb: 'modifies an action',
};

// Story templates: each is a function (rootWord, members) => { storyText, usedWords[] }
// usedWords are the actual word strings to find in storyText
const templates = [
  // Template 1: "The [noun] was [adj]. They [verb] it [adv]."
  (root, members) => {
    const noun = members.find((m) => m.partOfSpeech === 'noun');
    const adj = members.find((m) => m.partOfSpeech === 'adjective');
    const verb = members.find((m) => m.partOfSpeech === 'verb');
    if (!noun || !verb) return null;
    if (adj) {
      const text = `The ${noun.wordText} was quite ${adj.wordText}. They would ${verb.wordText} it carefully.`;
      return { text, words: [noun, adj, verb] };
    }
    const text = `The ${noun.wordText} was important. They would ${verb.wordText} it carefully.`;
    return { text, words: [noun, verb] };
  },
  // Template 2: "To [verb] requires [noun]."
  (root, members) => {
    const verb = members.find((m) => m.partOfSpeech === 'verb');
    const noun = members.find((m) => m.partOfSpeech === 'noun');
    if (!verb || !noun) return null;
    const text = `To ${verb.wordText} something well requires great ${noun.wordText} and dedication.`;
    return { text, words: [verb, noun] };
  },
  // Template 3: "She felt [adj] about the [noun]."
  (root, members) => {
    const adj = members.find((m) => m.partOfSpeech === 'adjective');
    const noun = members.find((m) => m.partOfSpeech === 'noun');
    if (!adj || !noun) return null;
    const text = `She felt ${adj.wordText} about the whole ${noun.wordText} situation.`;
    return { text, words: [adj, noun] };
  },
  // Template 4: "The [noun] helped them [verb] [adv]."
  (root, members) => {
    const noun = members.find((m) => m.partOfSpeech === 'noun');
    const verb = members.find((m) => m.partOfSpeech === 'verb');
    const adv = members.find((m) => m.partOfSpeech === 'adverb');
    if (!noun || !verb) return null;
    if (adv) {
      const text = `The ${noun.wordText} helped them ${verb.wordText} more ${adv.wordText} than before.`;
      return { text, words: [noun, verb, adv] };
    }
    const text = `The ${noun.wordText} helped them ${verb.wordText} more effectively than before.`;
    return { text, words: [noun, verb] };
  },
  // Template 5: "Being [adj] means you can [verb] with confidence."
  (root, members) => {
    const adj = members.find((m) => m.partOfSpeech === 'adjective');
    const verb = members.find((m) => m.partOfSpeech === 'verb');
    if (!adj || !verb) return null;
    const text = `Being ${adj.wordText} means you can ${verb.wordText} with greater confidence.`;
    return { text, words: [adj, verb] };
  },
  // Template 6: Generic with root word
  (root, members) => {
    const m1 = members[0];
    const m2 = members.length > 1 ? members[1] : null;
    if (!m1) return null;
    if (m2) {
      const text = `Learning about ${m1.wordText} also helps you understand ${m2.wordText} in context.`;
      return { text, words: [m1, m2] };
    }
    const text = `Understanding the word ${m1.wordText} is essential for building vocabulary.`;
    return { text, words: [m1] };
  },
];

function findWordInText(text, word) {
  // Case-insensitive search
  const lower = text.toLowerCase();
  const idx = lower.indexOf(word.toLowerCase());
  if (idx === -1) return null;
  return { startIndex: idx, endIndex: idx + word.length };
}

function buildDefinition(member) {
  return simpleDefs[member.partOfSpeech] || 'a word form';
}

const stories = [];

for (const family of families) {
  const { rootWord, members } = family;

  // Try each template until one works
  let generated = null;
  for (const template of templates) {
    const result = template(rootWord, members);
    if (result) {
      generated = result;
      break;
    }
  }

  if (!generated) continue;

  // Build highlighted words with computed indices
  const highlightedWords = [];
  const usedPositions = new Set();

  for (const member of generated.words) {
    const pos = findWordInText(generated.text, member.wordText);
    if (!pos) continue;

    // Skip if overlapping with existing highlight
    let overlaps = false;
    for (const used of usedPositions) {
      if (pos.startIndex < used.end && pos.endIndex > used.start) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    usedPositions.add({ start: pos.startIndex, end: pos.endIndex });
    highlightedWords.push({
      wordText: member.wordText,
      startIndex: pos.startIndex,
      endIndex: pos.endIndex,
      definition: buildDefinition(member),
      partOfSpeech: member.partOfSpeech,
    });
  }

  if (highlightedWords.length === 0) continue;

  // Validate: ensure sliced text matches wordText
  for (const hw of highlightedWords) {
    const sliced = generated.text.slice(hw.startIndex, hw.endIndex);
    if (sliced.toLowerCase() !== hw.wordText.toLowerCase()) {
      console.error(
        `VALIDATION FAILED: "${sliced}" !== "${hw.wordText}" in story for "${rootWord}"`
      );
      process.exit(1);
    }
  }

  stories.push({
    familyRootWord: rootWord,
    storyText: generated.text,
    highlightedWords: highlightedWords.sort((a, b) => a.startIndex - b.startIndex),
    difficultyLevel: 1,
  });
}

writeFileSync(outputPath, JSON.stringify(stories, null, 2) + '\n');
console.log(`Generated ${stories.length} micro-stories to ${outputPath}`);

// Final validation pass
const output = JSON.parse(readFileSync(outputPath, 'utf-8'));
let errors = 0;
for (const story of output) {
  for (const hw of story.highlightedWords) {
    const sliced = story.storyText.slice(hw.startIndex, hw.endIndex);
    if (sliced.toLowerCase() !== hw.wordText.toLowerCase()) {
      console.error(`INVALID: "${sliced}" vs "${hw.wordText}" in ${story.familyRootWord}`);
      errors++;
    }
  }
}
if (errors > 0) {
  console.error(`${errors} validation errors found!`);
  process.exit(1);
} else {
  console.log('All stories validated successfully!');
}
