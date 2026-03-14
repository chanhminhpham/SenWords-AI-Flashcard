#!/usr/bin/env node
/**
 * Fetch real pronunciation audio URLs from Free Dictionary API
 * and update base-5000.json with direct URLs (no Supabase Storage needed).
 *
 * Usage: node scripts/update-audio-urls.mjs [--count 20] [--all]
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DELAY_MS = 500;

const args = process.argv.slice(2);
const countIdx = args.indexOf('--count');
const doAll = args.includes('--all');
const COUNT = doAll ? 1000 : countIdx >= 0 ? parseInt(args[countIdx + 1], 10) : 20;

const seedPath = join(import.meta.dirname, '..', 'assets', 'dictionary', 'base-5000.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf-8'));

const wordsWithAudio = [];
for (let i = 0; i < seed.length && wordsWithAudio.length < COUNT; i++) {
  if (seed[i].audioUrlAmerican) wordsWithAudio.push(i);
}

console.log(`Processing ${wordsWithAudio.length} words...`);

async function fetchAudioUrls(word) {
  try {
    const res = await fetch(`${DICT_API}/${encodeURIComponent(word)}`);
    if (!res.ok) return { us: null, uk: null };
    const data = await res.json();

    let usUrl = null;
    let ukUrl = null;

    for (const entry of data) {
      for (const phonetic of entry.phonetics || []) {
        if (!phonetic.audio) continue;
        const audio = phonetic.audio;
        if (audio.includes('-us.mp3')) {
          usUrl = audio;
        } else if (audio.includes('-uk.mp3')) {
          ukUrl = audio;
        } else if (audio.includes('-au.mp3')) {
          if (!usUrl) usUrl = audio;
        }
      }
    }

    return { us: usUrl, uk: ukUrl };
  } catch {
    return { us: null, uk: null };
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let updated = 0;
  let noAudio = 0;

  for (let idx = 0; idx < wordsWithAudio.length; idx++) {
    const seedIdx = wordsWithAudio[idx];
    const word = seed[seedIdx].word;
    process.stdout.write(`[${idx + 1}/${wordsWithAudio.length}] ${word}...`);

    const { us, uk } = await fetchAudioUrls(word);

    if (us || uk) {
      seed[seedIdx].audioUrlAmerican = us || null;
      seed[seedIdx].audioUrlBritish = uk || null;
      updated++;
      console.log(` ✓ (US: ${us ? '✓' : '✗'}, UK: ${uk ? '✓' : '✗'})`);
    } else {
      // No audio found — null out so TTS fallback kicks in
      seed[seedIdx].audioUrlAmerican = null;
      seed[seedIdx].audioUrlBritish = null;
      noAudio++;
      console.log(' no audio, set to null');
    }

    await sleep(DELAY_MS);
  }

  writeFileSync(seedPath, JSON.stringify(seed, null, 2) + '\n');
  console.log(`\nDone! Updated: ${updated}, No audio: ${noAudio}`);
  console.log('Seed file written.');
}

main().catch(console.error);
