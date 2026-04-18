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
  school: { icon: "school", category: "study" },
  homework: { icon: "book", category: "study" },
  english: { icon: "book", category: "study" },
  book: { icon: "book", category: "study" },
  read: { icon: "book", category: "study" },
  write: { icon: "pencil", category: "study" },
  message: { icon: "envelope", category: "study" },
  music: { icon: "music", category: "study" },
  home: { icon: "house", category: "place" },
  room: { icon: "bed", category: "place" },
  park: { icon: "tree", category: "place" },
  door: { icon: "door", category: "place" },
  friend: { icon: "people", category: "place" },
  mother: { icon: "people", category: "place" },
  father: { icon: "people", category: "place" },
  breakfast: { icon: "plate", category: "food" },
  lunch: { icon: "plate", category: "food" },
  dinner: { icon: "plate", category: "food" },
  food: { icon: "plate", category: "food" },
  water: { icon: "drop", category: "food" },
  eat: { icon: "plate", category: "food" },
  drink: { icon: "cup", category: "food" },
  buy: { icon: "bag", category: "action" },
  go: { icon: "arrow", category: "action" },
  come: { icon: "arrow", category: "action" },
  play: { icon: "ball", category: "action" },
  soccer: { icon: "ball", category: "action" },
  call: { icon: "phone", category: "action" },
  use: { icon: "phone", category: "action" },
  phone: { icon: "phone", category: "action" },
  help: { icon: "hands", category: "action" },
  clean: { icon: "sparkle", category: "action" },
  watch: { icon: "screen", category: "action" },
  tv: { icon: "screen", category: "action" },
  bus: { icon: "bus", category: "action" },
  wake: { icon: "clock", category: "time" },
  "wake up": { icon: "clock", category: "time" },
  "get up": { icon: "sunrise", category: "time" },
  early: { icon: "sunrise", category: "time" },
  today: { icon: "calendar", category: "time" },
  now: { icon: "clock", category: "time" },
  tired: { icon: "moon", category: "emotion" },
  happy: { icon: "smile", category: "emotion" },
  ready: { icon: "check", category: "emotion" },
  busy: { icon: "pin", category: "emotion" },
  not: { icon: "minus", category: "emotion" },
  sunny: { icon: "sun", category: "weather" },
  rainy: { icon: "rain", category: "weather" },
  cloudy: { icon: "cloud", category: "weather" },
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

  return { icon: "sparkle", category: "default" };
}

function renderIcon(icon, palette) {
  switch (icon) {
    case "school":
      return `
  <rect x="374" y="420" width="276" height="204" rx="28" fill="#ffffff"/>
  <rect x="496" y="500" width="64" height="124" rx="20" fill="${palette.start}"/>
  <path d="M344 438L512 330L680 438" stroke="${palette.start}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="420" y="462" width="44" height="44" rx="12" fill="${palette.accent}"/>
  <rect x="560" y="462" width="44" height="44" rx="12" fill="${palette.accent}"/>`;
    case "book":
      return `
  <path d="M344 404C344 382 362 364 384 364H500C528 364 552 388 552 416V652H396C368 652 344 628 344 600V404Z" fill="#ffffff"/>
  <path d="M680 404C680 382 662 364 640 364H524C496 364 472 388 472 416V652H628C656 652 680 628 680 600V404Z" fill="${palette.accent}"/>
  <path d="M512 382V652" stroke="${palette.start}" stroke-width="22" stroke-linecap="round"/>
  <path d="M394 456H468M394 516H468M556 456H630M556 516H630" stroke="${palette.start}" stroke-width="16" stroke-linecap="round"/>`;
    case "pencil":
      return `
  <path d="M398 612L362 680L432 646L650 428L614 392L398 612Z" fill="#f59e0b"/>
  <path d="M614 392L650 428L696 382C710 368 710 346 696 332L678 314C664 300 642 300 628 314L614 328L650 364L614 392Z" fill="${palette.start}"/>
  <path d="M398 612L432 646L362 680L398 612Z" fill="#94a3b8"/>`;
    case "envelope":
      return `
  <rect x="348" y="398" width="328" height="228" rx="30" fill="#ffffff"/>
  <path d="M372 432L512 540L652 432" stroke="${palette.start}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M372 592L470 510M652 592L554 510" stroke="${palette.accent}" stroke-width="18" stroke-linecap="round"/>`;
    case "music":
      return `
  <path d="M590 368V560C574 550 554 544 532 544C484 544 446 574 446 612C446 650 484 680 532 680C580 680 618 650 618 612V442L676 428V542C660 532 640 526 618 526C570 526 532 556 532 594C532 632 570 662 618 662C666 662 704 632 704 594V388L590 368Z" fill="${palette.start}"/>`;
    case "house":
      return `
  <path d="M356 450L512 332L668 450V666H356V450Z" fill="#ffffff"/>
  <path d="M320 456L512 310L704 456" stroke="${palette.start}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="478" y="540" width="68" height="126" rx="22" fill="${palette.accent}"/>
  <rect x="408" y="480" width="48" height="48" rx="12" fill="${palette.accent}"/>
  <rect x="568" y="480" width="48" height="48" rx="12" fill="${palette.accent}"/>`;
    case "bed":
      return `
  <rect x="344" y="516" width="336" height="88" rx="30" fill="#ffffff"/>
  <rect x="344" y="452" width="116" height="84" rx="26" fill="${palette.accent}"/>
  <rect x="470" y="468" width="186" height="60" rx="24" fill="#dbeafe"/>
  <path d="M344 604V660M680 604V660" stroke="${palette.start}" stroke-width="20" stroke-linecap="round"/>`;
    case "tree":
      return `
  <circle cx="512" cy="448" r="118" fill="${palette.accent}"/>
  <circle cx="448" cy="500" r="88" fill="#bbf7d0"/>
  <circle cx="586" cy="506" r="78" fill="#a7f3d0"/>
  <rect x="486" y="544" width="52" height="132" rx="22" fill="#92400e"/>`;
    case "door":
      return `
  <rect x="404" y="348" width="216" height="360" rx="34" fill="#ffffff"/>
  <rect x="430" y="382" width="164" height="326" rx="24" fill="${palette.accent}"/>
  <circle cx="560" cy="552" r="16" fill="${palette.start}"/>`;
    case "people":
      return `
  <circle cx="448" cy="448" r="58" fill="#ffffff"/>
  <circle cx="584" cy="448" r="58" fill="${palette.accent}"/>
  <path d="M380 650C392 578 432 540 448 540C464 540 504 578 516 650" fill="#ffffff"/>
  <path d="M516 650C528 578 568 540 584 540C600 540 640 578 652 650" fill="${palette.accent}"/>`;
    case "plate":
      return `
  <circle cx="512" cy="520" r="180" fill="#ffffff"/>
  <circle cx="512" cy="520" r="108" fill="${palette.accent}" fill-opacity="0.6"/>
  <path d="M306 406V650M718 406V650" stroke="${palette.start}" stroke-width="18" stroke-linecap="round"/>
  <path d="M284 430H330M694 430H742" stroke="${palette.start}" stroke-width="18" stroke-linecap="round"/>`;
    case "drop":
      return `
  <path d="M512 348C512 348 404 478 404 560C404 624 452 676 512 676C572 676 620 624 620 560C620 478 512 348 512 348Z" fill="#ffffff"/>
  <path d="M482 494C462 526 454 554 454 576" stroke="${palette.accent}" stroke-width="18" stroke-linecap="round"/>`;
    case "cup":
      return `
  <path d="M404 420H620V554C620 620 574 668 512 668C450 668 404 620 404 554V420Z" fill="#ffffff"/>
  <path d="M620 446H654C690 446 716 470 716 504C716 538 690 562 654 562H620" stroke="${palette.start}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M446 382C446 354 470 336 470 308M520 382C520 354 544 336 544 308" stroke="${palette.accent}" stroke-width="16" stroke-linecap="round"/>`;
    case "bag":
      return `
  <rect x="396" y="414" width="232" height="250" rx="34" fill="#ffffff"/>
  <path d="M454 438C454 404 478 376 512 376C546 376 570 404 570 438" stroke="${palette.start}" stroke-width="22" stroke-linecap="round"/>
  <path d="M448 500H576" stroke="${palette.accent}" stroke-width="18" stroke-linecap="round"/>`;
    case "arrow":
      return `
  <path d="M356 512H644" stroke="${palette.start}" stroke-width="38" stroke-linecap="round"/>
  <path d="M566 420L668 512L566 604" stroke="#ffffff" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "ball":
      return `
  <circle cx="512" cy="520" r="170" fill="#ffffff"/>
  <path d="M512 350L572 402L548 474H476L452 402L512 350Z" fill="${palette.accent}"/>
  <path d="M452 402L396 468M572 402L628 468M476 474L436 580M548 474L588 580M512 690V620" stroke="${palette.start}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "phone":
      return `
  <rect x="426" y="336" width="172" height="352" rx="40" fill="#ffffff"/>
  <rect x="454" y="388" width="116" height="220" rx="22" fill="${palette.accent}"/>
  <circle cx="512" cy="642" r="14" fill="${palette.start}"/>`;
    case "hands":
      return `
  <path d="M394 584C394 528 430 490 474 490C504 490 526 512 526 542V632H446C418 632 394 610 394 584Z" fill="#ffffff"/>
  <path d="M630 584C630 528 594 490 550 490C520 490 498 512 498 542V632H578C606 632 630 610 630 584Z" fill="${palette.accent}"/>
  <path d="M470 648H554" stroke="${palette.start}" stroke-width="18" stroke-linecap="round"/>`;
    case "screen":
      return `
  <rect x="348" y="388" width="328" height="220" rx="30" fill="#ffffff"/>
  <rect x="392" y="432" width="240" height="132" rx="16" fill="${palette.accent}"/>
  <path d="M448 650H576M512 608V650" stroke="${palette.start}" stroke-width="20" stroke-linecap="round"/>`;
    case "bus":
      return `
  <rect x="334" y="404" width="356" height="194" rx="42" fill="#ffffff"/>
  <rect x="380" y="448" width="124" height="72" rx="16" fill="${palette.accent}"/>
  <rect x="524" y="448" width="116" height="72" rx="16" fill="${palette.accent}"/>
  <circle cx="422" cy="624" r="34" fill="${palette.start}"/>
  <circle cx="602" cy="624" r="34" fill="${palette.start}"/>`;
    case "clock":
      return `
  <circle cx="512" cy="520" r="182" fill="#ffffff"/>
  <path d="M512 430V526L584 576" stroke="${palette.start}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="512" cy="520" r="16" fill="${palette.accent}"/>`;
    case "sunrise":
      return `
  <path d="M364 596C388 492 440 436 512 436C584 436 636 492 660 596H364Z" fill="#ffffff"/>
  <path d="M334 620H690" stroke="${palette.start}" stroke-width="22" stroke-linecap="round"/>
  <path d="M512 322V382M426 356L458 392M598 356L566 392" stroke="${palette.accent}" stroke-width="18" stroke-linecap="round"/>`;
    case "calendar":
      return `
  <rect x="376" y="362" width="272" height="300" rx="34" fill="#ffffff"/>
  <rect x="376" y="362" width="272" height="82" rx="34" fill="${palette.accent}"/>
  <path d="M430 330V392M594 330V392" stroke="${palette.start}" stroke-width="18" stroke-linecap="round"/>
  <path d="M432 500H592M432 558H550" stroke="${palette.start}" stroke-width="18" stroke-linecap="round"/>`;
    case "moon":
      return `
  <path d="M586 352C530 372 492 426 492 488C492 566 552 630 628 638C600 668 558 686 512 686C420 686 346 612 346 520C346 428 420 354 512 354C538 354 564 360 586 352Z" fill="#ffffff"/>`;
    case "smile":
      return `
  <circle cx="512" cy="520" r="182" fill="#ffffff"/>
  <circle cx="448" cy="470" r="18" fill="${palette.start}"/>
  <circle cx="576" cy="470" r="18" fill="${palette.start}"/>
  <path d="M434 566C458 612 496 634 512 634C528 634 566 612 590 566" stroke="${palette.start}" stroke-width="22" stroke-linecap="round"/>`;
    case "check":
      return `
  <circle cx="512" cy="520" r="182" fill="#ffffff"/>
  <path d="M430 526L492 590L614 454" stroke="${palette.start}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "pin":
      return `
  <path d="M512 352C436 352 384 410 384 480C384 590 512 690 512 690C512 690 640 590 640 480C640 410 588 352 512 352Z" fill="#ffffff"/>
  <circle cx="512" cy="478" r="52" fill="${palette.accent}"/>`;
    case "minus":
      return `
  <circle cx="512" cy="520" r="182" fill="#ffffff"/>
  <path d="M422 520H602" stroke="${palette.start}" stroke-width="30" stroke-linecap="round"/>`;
    case "sun":
      return `
  <circle cx="512" cy="520" r="114" fill="#ffffff"/>
  <path d="M512 332V390M512 650V708M324 520H382M642 520H700M378 386L420 428M646 386L604 428M378 654L420 612M646 654L604 612" stroke="${palette.accent}" stroke-width="18" stroke-linecap="round"/>`;
    case "rain":
      return `
  <path d="M420 560C382 560 352 530 352 492C352 456 378 428 412 424C426 384 462 356 506 356C560 356 604 398 612 450C654 454 686 488 686 532C686 580 648 618 600 618H420Z" fill="#ffffff"/>
  <path d="M446 644L428 686M512 644L494 686M578 644L560 686" stroke="${palette.accent}" stroke-width="18" stroke-linecap="round"/>`;
    case "cloud":
      return `
  <path d="M420 584C380 584 348 552 348 512C348 474 376 444 412 440C426 398 462 368 506 368C560 368 604 410 612 462C654 466 686 500 686 544C686 592 648 630 600 630H420Z" fill="#ffffff"/>`;
    case "sparkle":
      return `
  <path d="M512 360L548 472L660 508L548 544L512 656L476 544L364 508L476 472L512 360Z" fill="#ffffff"/>`;
    default:
      return `
  <circle cx="512" cy="520" r="182" fill="#ffffff"/>
  <path d="M512 408L542 490L624 520L542 550L512 632L482 550L400 520L482 490L512 408Z" fill="${palette.accent}"/>`;
  }
}

function buildSvg(row, iconRecord) {
  const palette = CATEGORY_STYLES[iconRecord.category] ?? CATEGORY_STYLES.default;
  const accentMark =
    row.punctuation === "?"
      ? `<circle cx="740" cy="310" r="34" fill="#ffffff" fill-opacity="0.16"/>
  <path d="M740 292C740 278 752 268 768 268C784 268 796 278 796 292C796 308 782 314 772 322C764 328 760 336 760 346" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/>
  <circle cx="760" cy="374" r="8" fill="#ffffff"/>`
      : `<path d="M744 274L756 304L786 316L756 328L744 358L732 328L702 316L732 304L744 274Z" fill="#ffffff" fill-opacity="0.82"/>`;

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
  <circle cx="512" cy="512" r="206" fill="white" fill-opacity="0.96"/>
  ${renderIcon(iconRecord.icon, palette)}
  ${accentMark}
  <path d="M286 720L298 748L326 760L298 772L286 800L274 772L246 760L274 748L286 720Z" fill="#ffffff" fill-opacity="0.68"/>
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
