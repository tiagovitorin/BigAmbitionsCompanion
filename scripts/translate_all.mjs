import fs from 'fs';
import path from 'path';
import https from 'https';

// --- CONFIGURATION ---
// API keys are supplied via environment variables - never commit them.
// Set GCP_TRANSLATE_KEYS to a comma-separated list of keys before running.
const keysRaw = process.env.GCP_TRANSLATE_KEYS || '';
const KEYS = keysRaw.split(',').map((s) => s.trim()).filter(Boolean);
if (KEYS.length === 0) {
  console.error('No translation keys found. Set GCP_TRANSLATE_KEYS (comma-separated) before running.');
  process.exit(1);
}

const LOCALES_DIR = path.resolve('web/src/locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

const TARGET_LANGS = [
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'zh-cn', name: 'Simplified Chinese' },
  { code: 'zh-tw', name: 'Traditional Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'el', name: 'Greek' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ar', name: 'Arabic' }
];

let keyIdx = 0;
function getNextKey() {
  const k = KEYS[keyIdx % KEYS.length];
  keyIdx++;
  return k;
}

function cleanTypography(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\u2014/g, ' - ').replace(/\u2013/g, ' - ');
  }
  if (Array.isArray(obj)) return obj.map(cleanTypography);
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const k of Object.keys(obj)) res[k] = cleanTypography(obj[k]);
    return res;
  }
  return obj;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

function extractMissingKeys(ref, target) {
  const missing = {};
  for (const k in ref) {
    if (target[k] === undefined) {
      missing[k] = ref[k];
    } else if (typeof ref[k] === 'object' && ref[k] !== null && !Array.isArray(ref[k])) {
      const subMissing = extractMissingKeys(ref[k], target[k] || {});
      if (Object.keys(subMissing).length > 0) {
        missing[k] = subMissing;
      }
    }
  }
  return missing;
}

function countKeys(obj) {
  let count = 0;
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      count += countKeys(obj[k]);
    } else {
      count++;
    }
  }
  return count;
}

async function callGemini(promptText, langName) {
  const systemInstruction = `You are an expert video game localizer specializing in the business tycoon simulation game 'Big Ambitions'.
Translate the provided JSON dictionary from English into ${langName} with professional, native video game localization quality.

STRICT RULES:
1. Return ONLY valid JSON with the exact same nested keys and structure. Do NOT wrap with markdown blocks or backticks.
2. NEVER use em dashes ("\\u2014"). Always use standard hyphens ("-") with space padding.
3. NO emojis anywhere.
4. VERBATIM PLACEHOLDERS: Preserve all format specifiers and variable placeholders verbatim: {count}, {name}, {district}, {rate}, {cost}, {hours}, {current}, {total}, \${taxes}, \${cash}, \${loans}, {query}, {error}.
5. KEEP TECHNICAL/GAME TERMS INTACT: "Big Ambitions", "Uncle Fred", "Live HQ", "Compendium", store building types, and address formats.`;

  const postData = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  });

  const models = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];

  for (let attempt = 0; attempt < 12; attempt++) {
    const key = getNextKey();
    const model = models[attempt % models.length];

    try {
      const resText = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'generativelanguage.googleapis.com',
          path: `/v1beta/models/${model}:generateContent?key=${key}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 45000
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 150)}`));
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.write(postData);
        req.end();
      });

      const json = JSON.parse(resText);
      let text = json.candidates[0].content.parts[0].text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);
      return JSON.parse(text.trim());
    } catch (e) {
      console.warn(`  [Attempt ${attempt + 1}] (${model}) ${e.message}. Retrying with next key...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error(`Failed to translate for ${langName} after 12 attempts.`);
}

async function run() {
  console.log("=================================================");
  console.log(" Big Ambitions Companion - Automated i18n Sync   ");
  console.log("=================================================\n");

  for (const target of TARGET_LANGS) {
    const langFile = path.join(LOCALES_DIR, `${target.code}.json`);
    let langData = {};
    if (fs.existsSync(langFile)) {
      langData = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    }

    const missingObj = extractMissingKeys(enData, langData);
    const missingCount = countKeys(missingObj);

    console.log(`[${target.code.toUpperCase()}] ${target.name}: ${missingCount} missing keys.`);

    if (missingCount === 0) {
      continue;
    }

    // Process in batches if payload is large
    const keysToTranslate = Object.keys(missingObj);
    const CHUNK_SIZE = 4; // Top-level namespaces chunk
    for (let i = 0; i < keysToTranslate.length; i += CHUNK_SIZE) {
      const chunkKeys = keysToTranslate.slice(i, i + CHUNK_SIZE);
      const chunkPayload = {};
      for (const k of chunkKeys) {
        chunkPayload[k] = missingObj[k];
      }

      console.log(`  -> Translating namespaces [${chunkKeys.join(', ')}]...`);
      const translatedChunk = await callGemini(JSON.stringify(chunkPayload, null, 2), target.name);
      const cleaned = cleanTypography(translatedChunk);
      deepMerge(langData, cleaned);
      fs.writeFileSync(langFile, JSON.stringify(langData, null, 2) + '\n', 'utf8');
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`  -> Saved ${target.code}.json\n`);
  }

  console.log("All languages synced! Running final missing key audit...\n");
  const auditStatus = {};
  for (const target of TARGET_LANGS) {
    const langFile = path.join(LOCALES_DIR, `${target.code}.json`);
    const langData = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    const missing = countKeys(extractMissingKeys(enData, langData));
    auditStatus[target.code] = missing;
  }
  console.log(JSON.stringify(auditStatus, null, 2));
}

run().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
