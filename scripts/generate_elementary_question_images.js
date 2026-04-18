const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "public", "images", "questions");
const MANIFEST_PATH = path.join(ROOT, "src", "lib", "generatedQuestionImages.ts");
const ENV_PATH = path.join(ROOT, ".env.local");

function readEnvFile() {
  return Object.fromEntries(
    fs
      .readFileSync(ENV_PATH, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const CATEGORY_STYLES = {
  study: { start: "#4f46e5", end: "#1d4ed8", accent: "#c7d2fe" },
  place: { start: "#0f766e", end: "#0f766e", accent: "#99f6e4" },
  food: { start: "#ea580c", end: "#c2410c", accent: "#fdba74" },
  action: { start: "#2563eb", end: "#1e40af", accent: "#93c5fd" },
  emotion: { start: "#db2777", end: "#be185d", accent: "#f9a8d4" },
  time: { start: "#7c3aed", end: "#5b21b6", accent: "#c4b5fd" },
  weather: { start: "#0891b2", end: "#0e7490", accent: "#a5f3fc" },
  default: { start: "#475569", end: "#1e293b", accent: "#cbd5e1" },
};

const ICON_MAP = {
  school: { icon: "\u{1F3EB}", category: "study" },
  homework: { icon: "\u{1F4D8}", category: "study" },
  english: { icon: "\u{1F4DA}", category: "study" },
  book: { icon: "\u{1F4D6}", category: "study" },
  read: { icon: "\u{1F4D6}", category: "study" },
  write: { icon: "\u{270D}\uFE0F", category: "study" },
  message: { icon: "\u{1F4E9}", category: "study" },
  music: { icon: "\u{1F3B5}", category: "study" },
  home: { icon: "\u{1F3E0}", category: "place" },
  room: { icon: "\u{1F6CF}\uFE0F", category: "place" },
  park: { icon: "\u{1F333}", category: "place" },
  door: { icon: "\u{1F6AA}", category: "place" },
  friend: { icon: "\u{1F91D}", category: "place" },
  mother: { icon: "\u{1F469}", category: "place" },
  father: { icon: "\u{1F468}", category: "place" },
  breakfast: { icon: "\u{1F95E}", category: "food" },
  lunch: { icon: "\u{1F371}", category: "food" },
  dinner: { icon: "\u{1F37D}\uFE0F", category: "food" },
  food: { icon: "\u{1F957}", category: "food" },
  water: { icon: "\u{1F4A7}", category: "food" },
  eat: { icon: "\u{1F37D}\uFE0F", category: "food" },
  drink: { icon: "\u{1F964}", category: "food" },
  buy: { icon: "\u{1F6CD}\uFE0F", category: "action" },
  go: { icon: "\u{1F6B6}", category: "action" },
  come: { icon: "\u{1F3E0}", category: "action" },
  play: { icon: "\u{26BD}", category: "action" },
  soccer: { icon: "\u{26BD}", category: "action" },
  call: { icon: "\u{1F4DE}", category: "action" },
  use: { icon: "\u{1F4F1}", category: "action" },
  phone: { icon: "\u{1F4F1}", category: "action" },
  help: { icon: "\u{1FAE4}", category: "action" },
  clean: { icon: "\u{1F9F9}", category: "action" },
  watch: { icon: "\u{1F4FA}", category: "action" },
  tv: { icon: "\u{1F4FA}", category: "action" },
  bus: { icon: "\u{1F68C}", category: "action" },
  wake: { icon: "\u{23F0}", category: "time" },
  "wake up": { icon: "\u{23F0}", category: "time" },
  "get up": { icon: "\u{1F305}", category: "time" },
  early: { icon: "\u{1F305}", category: "time" },
  today: { icon: "\u{1F4C5}", category: "time" },
  now: { icon: "\u{23F1}\uFE0F", category: "time" },
  tired: { icon: "\u{1F62A}", category: "emotion" },
  happy: { icon: "\u{1F604}", category: "emotion" },
  ready: { icon: "\u{2705}", category: "emotion" },
  busy: { icon: "\u{1F4CC}", category: "emotion" },
  not: { icon: "\u{1F6AB}", category: "emotion" },
  sunny: { icon: "\u{2600}\uFE0F", category: "weather" },
  rainy: { icon: "\u{1F327}\uFE0F", category: "weather" },
  cloudy: { icon: "\u{2601}\uFE0F", category: "weather" },
};

const STOP_WORDS = new Set([
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "am",
  "is",
  "are",
  "be",
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "a",
  "an",
  "the",
  "to",
  "at",
  "in",
  "on",
  "with",
  "very",
  "some",
]);

function determineIconRecord(row) {
  const hint = (row.hint ?? "").trim().toLowerCase();
  if (ICON_MAP[hint]) return ICON_MAP[hint];

  const tokens = row.words.map((token) => token.toLowerCase());
  for (const token of tokens) {
    if (ICON_MAP[token]) return ICON_MAP[token];
  }

  const candidate = tokens.find((token) => !STOP_WORDS.has(token));
  if (candidate && ICON_MAP[candidate]) return ICON_MAP[candidate];

  return { icon: "\u{1F4A1}", category: "default" };
}

function buildSvg(row, iconRecord) {
  const palette = CATEGORY_STYLES[iconRecord.category] ?? CATEGORY_STYLES.default;
  const sparkle = row.punctuation === "?" ? "\u{2753}" : "\u{2728}";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="140" y1="80" x2="900" y2="940" gradientUnits="userSpaceOnUse">
      <stop stop-color="${palette.start}"/>
      <stop offset="1" stop-color="${palette.end}"/>
    </linearGradient>
    <filter id="shadow" x="140" y="116" width="744" height="792" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="26" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="240" fill="url(#bg)"/>
  <circle cx="190" cy="180" r="94" fill="${palette.accent}" fill-opacity="0.26"/>
  <circle cx="844" cy="208" r="64" fill="white" fill-opacity="0.14"/>
  <circle cx="838" cy="838" r="118" fill="${palette.accent}" fill-opacity="0.16"/>
  <g filter="url(#shadow)">
    <rect x="156" y="156" width="712" height="712" rx="188" fill="white" fill-opacity="0.94"/>
  </g>
  <circle cx="512" cy="512" r="250" fill="${palette.accent}" fill-opacity="0.28"/>
  <circle cx="512" cy="512" r="198" fill="white" fill-opacity="0.94"/>
  <text x="512" y="590" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif" font-size="252">${iconRecord.icon}</text>
  <text x="740" y="310" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif" font-size="72" fill-opacity="0.92">${sparkle}</text>
  <text x="286" y="760" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif" font-size="64" fill-opacity="0.82">${sparkle}</text>
</svg>`;
}

async function main() {
  const env = readEnvFile();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from("questions")
    .select("id,level,sentence,japanese,words,punctuation,hint")
    .eq("level", "elementary")
    .order("sentence", { ascending: true });

  if (error) throw error;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifestLines = [];
  for (const row of data ?? []) {
    const iconRecord = determineIconRecord(row);
    const fileName = `${row.id}.svg`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, buildSvg(row, iconRecord), "utf8");
    manifestLines.push(
      `  "${row.id}": { imageName: "${fileName}", imageStatus: "ready", level: "elementary", sentence: ${JSON.stringify(
        row.sentence
      )} },`
    );
  }

  const source = `export const GENERATED_QUESTION_IMAGE_MANIFEST: Record<string, { imageName: string; imageStatus: "ready"; level: "elementary"; sentence: string }> = {\n${manifestLines.join(
    "\n"
  )}\n};\n`;
  fs.writeFileSync(MANIFEST_PATH, source, "utf8");

  console.log(`Generated ${(data ?? []).length} elementary question images.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
