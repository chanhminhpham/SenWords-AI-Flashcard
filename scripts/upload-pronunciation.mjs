#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Download pronunciation audio from Free Dictionary API and upload to Supabase Storage.
 * Usage: node scripts/upload-pronunciation.mjs [--count 20] [--all]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://aneuyixupvtqgnxchnny.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1UC2xrgdxreYbkTd8_PF1A_St_MfG1p';
const BUCKET = 'pronunciation';
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DELAY_MS = 500; // Rate limit: ~2 requests/second

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Parse args
const args = process.argv.slice(2);
const countIdx = args.indexOf('--count');
const doAll = args.includes('--all');
const COUNT = doAll ? 1000 : countIdx >= 0 ? parseInt(args[countIdx + 1], 10) : 20;

// Load seed data
const seedPath = join(import.meta.dirname, '..', 'assets', 'dictionary', 'base-5000.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf-8'));
const wordsWithAudio = seed.filter((w) => w.audioUrlAmerican).slice(0, COUNT);

console.log(`Processing ${wordsWithAudio.length} words...`);

// Ensure bucket exists
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) {
      console.error('Failed to create bucket:', error.message);
      // Bucket might already exist with different permissions
    } else {
      console.log(`Created bucket: ${BUCKET}`);
    }
  } else {
    console.log(`Bucket "${BUCKET}" already exists`);
  }
}

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
        if (audio.includes('-us.mp3') || audio.includes('-us.ogg')) {
          usUrl = audio;
        } else if (audio.includes('-uk.mp3') || audio.includes('-uk.ogg')) {
          ukUrl = audio;
        } else if (audio.includes('-au.mp3')) {
          // Use Australian as US fallback if no US available
          if (!usUrl) usUrl = audio;
        }
      }
    }

    return { us: usUrl, uk: ukUrl };
  } catch {
    return { us: null, uk: null };
  }
}

async function downloadAndUpload(sourceUrl, storagePath) {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return false;

    const buffer = Buffer.from(await res.arrayBuffer());

    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

    if (error) {
      console.error(`  Upload failed ${storagePath}: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`  Download failed ${sourceUrl}: ${err.message}`);
    return false;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await ensureBucket();

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of wordsWithAudio) {
    const word = entry.word;
    process.stdout.write(
      `[${uploaded + skipped + failed + 1}/${wordsWithAudio.length}] ${word}...`
    );

    const { us, uk } = await fetchAudioUrls(word);

    if (!us && !uk) {
      console.log(' no audio found, skipping');
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    let wordUploaded = false;

    // Upload US audio
    if (us) {
      const usPath = `${word}_us.mp3`;
      const ok = await downloadAndUpload(us, usPath);
      if (ok) wordUploaded = true;
    }

    // Upload UK audio
    if (uk) {
      const ukPath = `${word}_uk.mp3`;
      const ok = await downloadAndUpload(uk, ukPath);
      if (ok) wordUploaded = true;
    }

    if (wordUploaded) {
      uploaded++;
      console.log(` ✓ (US: ${us ? '✓' : '✗'}, UK: ${uk ? '✓' : '✗'})`);
    } else {
      failed++;
      console.log(' ✗ upload failed');
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
