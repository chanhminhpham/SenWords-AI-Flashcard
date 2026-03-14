/**
 * Upload real vocabulary images from Pixabay to Supabase Storage.
 *
 * Usage:
 *   PIXABAY_KEY=your-key SERVICE_ROLE_KEY=your-key node scripts/upload-vocab-images.mjs
 *
 * Get a free Pixabay API key at: https://pixabay.com/api/docs/
 * Requires: EXPO_PUBLIC_SUPABASE_URL in .env
 */
import { Buffer } from 'node:buffer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────
const ENV_PATH = resolve(__dirname, '../.env');
const envContent = readFileSync(ENV_PATH, 'utf-8');
const SUPABASE_URL = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY;
const PIXABAY_KEY = process.env.PIXABAY_KEY;

if (!SUPABASE_URL) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL in .env');
if (!SERVICE_KEY) throw new Error('Set SERVICE_ROLE_KEY env var');
if (!PIXABAY_KEY)
  throw new Error('Set PIXABAY_KEY env var (free at https://pixabay.com/api/docs/)');

const BUCKET = 'vocabulary-images';
const DICT_PATH = resolve(__dirname, '../assets/dictionary/base-5000.json');
const CONCURRENCY = 5; // Pixabay rate limit: 100 req/min
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 280;
const PIXABAY_API = 'https://pixabay.com/api/';

// ─── Pixabay search ─────────────────────────────────────────
async function searchPixabay(word) {
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q: word,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: '3',
    min_width: '400',
  });

  const res = await fetch(`${PIXABAY_API}?${params}`);
  if (!res.ok) {
    if (res.status === 429) {
      // Rate limited — wait and retry
      console.log(`  ⏳ Rate limited, waiting 30s...`);
      await sleep(30000);
      return searchPixabay(word);
    }
    throw new Error(`Pixabay search failed for "${word}": ${res.status}`);
  }

  const data = await res.json();
  if (data.hits && data.hits.length > 0) {
    // Use webformatURL (640px wide, fast to download)
    return data.hits[0].webformatURL;
  }
  return null;
}

// ─── Download + resize ──────────────────────────────────────
async function downloadAndResize(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());

  return sharp(buffer)
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
}

// ─── Fallback placeholder ───────────────────────────────────
async function generatePlaceholder(word) {
  const letter = word.length > 0 ? word[0].toUpperCase() : '?';
  const displayWord = word.length > 12 ? word.slice(0, 12) + '…' : word;

  const svg = `
    <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#E8F4ED;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFF8F0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" rx="12" fill="url(#bg)" />
      <text x="50%" y="42%" dominant-baseline="central" text-anchor="middle"
            font-family="sans-serif" font-size="96" font-weight="700" fill="#2D8A5E" opacity="0.3">
        ${letter}
      </text>
      <text x="50%" y="70%" dominant-baseline="central" text-anchor="middle"
            font-family="sans-serif" font-size="24" font-weight="600" fill="#2D8A5E">
        ${escapeXml(displayWord)}
      </text>
    </svg>`;

  return sharp(Buffer.from(svg)).webp({ quality: 75 }).toBuffer();
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Upload ─────────────────────────────────────────────────
async function uploadToSupabase(word, buffer) {
  const fileName = `${word}_card.webp`;
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload ${fileName} failed: ${res.status} ${body}`);
  }
  return fileName;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Process single word ────────────────────────────────────
async function processWord(word) {
  let imageUrl = null;
  let source = 'placeholder';

  try {
    imageUrl = await searchPixabay(word);
  } catch {
    // Search failed — fall back to placeholder
  }

  let buffer;
  if (imageUrl) {
    try {
      buffer = await downloadAndResize(imageUrl);
      source = 'pixabay';
    } catch {
      buffer = await generatePlaceholder(word);
    }
  } else {
    buffer = await generatePlaceholder(word);
  }

  await uploadToSupabase(word, buffer);
  return { word, source };
}

// ─── Batch runner ───────────────────────────────────────────
async function processBatch(words) {
  const results = { pixabay: 0, placeholder: 0, failed: 0 };
  let processed = 0;

  for (let i = 0; i < words.length; i += CONCURRENCY) {
    const batch = words.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (word) => {
      try {
        const result = await processWord(word);
        results[result.source]++;
        return result;
      } catch (err) {
        console.error(`  ✗ ${word}: ${err.message}`);
        results.failed++;
        return { word, source: 'failed' };
      }
    });

    await Promise.all(promises);
    processed += batch.length;

    if (processed % 50 === 0 || processed === words.length) {
      console.log(
        `  ✓ ${processed}/${words.length} — pixabay: ${results.pixabay}, placeholder: ${results.placeholder}, failed: ${results.failed}`
      );
    }

    // Rate limit: ~100 req/min for Pixabay free tier
    if (i + CONCURRENCY < words.length) {
      await sleep(3000);
    }
  }

  return results;
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('Loading dictionary...');
  const dictionary = JSON.parse(readFileSync(DICT_PATH, 'utf-8'));

  const wordsWithImages = dictionary
    .filter((e) => e.imageUrl && e.mediaType === 'image')
    .map((e) => e.word);

  console.log(`Found ${wordsWithImages.length} words to process`);
  console.log(
    `Searching Pixabay + uploading to ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
  );
  console.log('');

  const startTime = Date.now();
  const results = await processBatch(wordsWithImages);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log(`✅ Done in ${elapsed}s`);
  console.log(`   Real photos: ${results.pixabay}`);
  console.log(`   Placeholders: ${results.placeholder}`);
  console.log(`   Failed: ${results.failed}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
