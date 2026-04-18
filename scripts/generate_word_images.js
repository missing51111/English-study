const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const EMOJI_MAP_PATH = path.join(ROOT, "src", "lib", "emojiMap.ts");
const OUTPUT_DIR = path.join(ROOT, "public", "images", "words");
const MANIFEST_PATH = path.join(ROOT, "src", "lib", "generatedWordImages.ts");

function readEnvFile() {
  const envText = fs.readFileSync(ENV_PATH, "utf8");
  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function loadEmojiMap() {
  const text = fs.readFileSync(EMOJI_MAP_PATH, "utf8");
  const matches = [...text.matchAll(/\b([a-z][a-z0-9]*)\s*:\s*"([^"]+)"/g)];
  return Object.fromEntries(matches.map((match) => [match[1].toLowerCase(), match[2]]));
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getPalette(partOfSpeech) {
  if (partOfSpeech === "verb") {
    return {
      start: "#14b8a6",
      end: "#0f766e",
      accent: "#99f6e4",
      label: "verb",
    };
  }

  if (partOfSpeech === "adj") {
    return {
      start: "#fb923c",
      end: "#c2410c",
      accent: "#fdba74",
      label: "adjective",
    };
  }

  return {
    start: "#60a5fa",
    end: "#2563eb",
    accent: "#bfdbfe",
    label: "noun",
  };
}

function buildSvg(row, emoji) {
  const palette = getPalette(row.part_of_speech);
  const meaning = escapeXml(row.meaning);
  const word = escapeXml(row.word);
  const posLabel = escapeXml(palette.label);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="128" y1="96" x2="896" y2="928" gradientUnits="userSpaceOnUse">
      <stop stop-color="${palette.start}"/>
      <stop offset="1" stop-color="${palette.end}"/>
    </linearGradient>
    <linearGradient id="card" x1="192" y1="160" x2="832" y2="864" gradientUnits="userSpaceOnUse">
      <stop stop-color="rgba(255,255,255,0.96)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0.88)"/>
    </linearGradient>
    <filter id="shadow" x="150" y="124" width="724" height="776" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>
  <circle cx="180" cy="168" r="96" fill="${palette.accent}" fill-opacity="0.24"/>
  <circle cx="856" cy="200" r="64" fill="white" fill-opacity="0.14"/>
  <circle cx="840" cy="832" r="110" fill="${palette.accent}" fill-opacity="0.18"/>
  <g filter="url(#shadow)">
    <rect x="144" y="132" width="736" height="760" rx="180" fill="white" fill-opacity="0.9"/>
  </g>
  <rect x="208" y="192" width="608" height="88" rx="44" fill="${palette.accent}" fill-opacity="0.95"/>
  <text x="512" y="247" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="700" fill="#0f172a" letter-spacing="3.2">${posLabel}</text>
  <circle cx="512" cy="520" r="236" fill="${palette.accent}" fill-opacity="0.3"/>
  <circle cx="512" cy="520" r="188" fill="white" fill-opacity="0.86"/>
  <text x="512" y="598" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif" font-size="232">${emoji}</text>
  <text x="512" y="806" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="700" fill="#0f172a">${word}</text>
  <text x="512" y="860" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="600" fill="#475569">${meaning}</text>
</svg>`;
}

async function main() {
  const env = readEnvFile();
  const emojiMap = loadEmojiMap();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from("words")
    .select("id, level, word, meaning, part_of_speech")
    .in("part_of_speech", ["noun", "verb", "adj"])
    .order("level")
    .order("word");

  if (error) {
    throw new Error(error.message);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const matchedRows = data.filter((row) => emojiMap[row.word.toLowerCase()]);

  for (const row of matchedRows) {
    const fileName = `${row.id}.svg`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const svg = buildSvg(row, emojiMap[row.word.toLowerCase()]);
    fs.writeFileSync(filePath, svg, "utf8");
  }

  const manifestLines = matchedRows.map(
    (row) =>
      `  "${row.id}": { imageName: "${row.id}.svg", imageStatus: "ready", word: ${JSON.stringify(
        row.word
      )} },`
  );

  const manifestSource = `export const GENERATED_WORD_IMAGE_MANIFEST: Record<string, { imageName: string; imageStatus: "ready"; word: string }> = {
${manifestLines.join("\n")}
};
`;

  fs.writeFileSync(MANIFEST_PATH, manifestSource, "utf8");

  console.log(`Generated ${matchedRows.length} word images.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
