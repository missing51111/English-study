const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();

function loadEnv() {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const env = fs.readFileSync(envPath, "utf8");
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

const subjectMap = {
  I: "わたしは",
  You: "あなたは",
  He: "かれは",
  She: "かのじょは",
  We: "わたしたちは",
  They: "かれらは",
};

const timeMap = {
  "every day": "毎日",
  now: "今",
  today: "今日",
  later: "あとで",
  tonight: "今夜",
  "this morning": "今朝",
  "after school": "放課後",
  yesterday: "きのう",
  tomorrow: "明日",
};

const phraseEntries = [
  {
    simple: ["do my homework", "does my homework"],
    past: ["did my homework"],
    progressive: ["doing my homework"],
    jp: {
      present: "わたしの 宿題を します",
      past: "わたしの 宿題を しました",
      progressive: "わたしの 宿題を しています",
      future: "わたしの 宿題を する つもりです",
      can: "わたしの 宿題を することが できます",
    },
  },
  {
    simple: ["buy some food", "buys some food"],
    past: ["bought some food"],
    progressive: ["buying some food"],
    jp: {
      present: "食べ物を 買います",
      past: "食べ物を 買いました",
      progressive: "食べ物を 買っています",
      future: "食べ物を 買う つもりです",
      can: "食べ物を 買うことが できます",
    },
  },
  {
    simple: ["clean my room", "cleans my room"],
    past: ["cleaned my room"],
    progressive: ["cleaning my room"],
    jp: {
      present: "わたしの 部屋を そうじします",
      past: "わたしの 部屋を そうじしました",
      progressive: "わたしの 部屋を そうじしています",
      future: "わたしの 部屋を そうじする つもりです",
      can: "わたしの 部屋を そうじすることが できます",
    },
  },
  {
    simple: ["call my mother", "calls my mother"],
    past: ["called my mother"],
    progressive: ["calling my mother"],
    jp: {
      present: "わたしの 母に 電話を します",
      past: "わたしの 母に 電話を しました",
      progressive: "わたしの 母に 電話を しています",
      future: "わたしの 母に 電話を する つもりです",
      can: "わたしの 母に 電話を することが できます",
    },
  },
  {
    simple: ["go to school", "goes to school"],
    past: ["went to school"],
    progressive: ["going to school"],
    jp: {
      present: "学校へ 行きます",
      past: "学校へ 行きました",
      progressive: "学校へ 行っています",
      future: "学校へ 行く つもりです",
      can: "学校へ 行くことが できます",
    },
  },
  {
    simple: ["watch TV", "watches TV"],
    past: ["watched TV"],
    progressive: ["watching TV"],
    jp: {
      present: "テレビを 見ます",
      past: "テレビを 見ました",
      progressive: "テレビを 見ています",
      future: "テレビを 見る つもりです",
      can: "テレビを 見ることが できます",
    },
  },
  {
    simple: ["listen to music", "listens to music"],
    past: ["listened to music"],
    progressive: ["listening to music"],
    jp: {
      present: "音楽を 聞きます",
      past: "音楽を 聞きました",
      progressive: "音楽を 聞いています",
      future: "音楽を 聞く つもりです",
      can: "音楽を 聞くことが できます",
    },
  },
  {
    simple: ["walk to school", "walks to school"],
    past: ["walked to school"],
    progressive: ["walking to school"],
    jp: {
      present: "学校へ 歩いて 行きます",
      past: "学校へ 歩いて 行きました",
      progressive: "学校へ 歩いて 行っています",
      future: "学校へ 歩いて 行く つもりです",
      can: "学校へ 歩いて 行くことが できます",
    },
  },
  {
    simple: ["study English", "studies English"],
    past: ["studied English"],
    progressive: ["studying English"],
    jp: {
      present: "英語を 勉強します",
      past: "英語を 勉強しました",
      progressive: "英語を 勉強しています",
      future: "英語を 勉強する つもりです",
      can: "英語を 勉強することが できます",
    },
  },
  {
    simple: ["use my phone", "uses my phone"],
    past: ["used my phone"],
    progressive: ["using my phone"],
    jp: {
      present: "わたしの 電話を 使います",
      past: "わたしの 電話を 使いました",
      progressive: "わたしの 電話を 使っています",
      future: "わたしの 電話を 使う つもりです",
      can: "わたしの 電話を 使うことが できます",
    },
  },
  {
    simple: ["take a bus", "takes a bus"],
    past: ["took a bus"],
    progressive: ["taking a bus"],
    jp: {
      present: "バスに 乗ります",
      past: "バスに 乗りました",
      progressive: "バスに 乗っています",
      future: "バスに 乗る つもりです",
      can: "バスに 乗ることが できます",
    },
  },
  {
    simple: ["meet my friend", "meets my friend"],
    past: ["met my friend"],
    progressive: ["meeting my friend"],
    jp: {
      present: "わたしの 友だちに 会います",
      past: "わたしの 友だちに 会いました",
      progressive: "わたしの 友だちに 会っています",
      future: "わたしの 友だちに 会う つもりです",
      can: "わたしの 友だちに 会うことが できます",
    },
  },
  {
    simple: ["play soccer", "plays soccer"],
    past: ["played soccer"],
    progressive: ["playing soccer"],
    jp: {
      present: "サッカーを します",
      past: "サッカーを しました",
      progressive: "サッカーを しています",
      future: "サッカーを する つもりです",
      can: "サッカーを することが できます",
    },
  },
  {
    simple: ["eat lunch", "eats lunch"],
    past: ["ate lunch"],
    progressive: ["eating lunch"],
    jp: {
      present: "昼ごはんを 食べます",
      past: "昼ごはんを 食べました",
      progressive: "昼ごはんを 食べています",
      future: "昼ごはんを 食べる つもりです",
      can: "昼ごはんを 食べることが できます",
    },
  },
  {
    simple: ["run in the park", "runs in the park"],
    past: ["ran in the park"],
    progressive: ["running in the park"],
    jp: {
      present: "公園で 走ります",
      past: "公園で 走りました",
      progressive: "公園で 走っています",
      future: "公園で 走る つもりです",
      can: "公園で 走ることが できます",
    },
  },
  {
    simple: ["open the door", "opens the door"],
    past: ["opened the door"],
    progressive: ["opening the door"],
    jp: {
      present: "ドアを 開けます",
      past: "ドアを 開けました",
      progressive: "ドアを 開けています",
      future: "ドアを 開ける つもりです",
      can: "ドアを 開けることが できます",
    },
  },
  {
    simple: ["help my friend", "helps my friend"],
    past: ["helped my friend"],
    progressive: ["helping my friend"],
    jp: {
      present: "わたしの 友だちを 手伝います",
      past: "わたしの 友だちを 手伝いました",
      progressive: "わたしの 友だちを 手伝っています",
      future: "わたしの 友だちを 手伝う つもりです",
      can: "わたしの 友だちを 手伝うことが できます",
    },
  },
  {
    simple: ["drink water", "drinks water"],
    past: ["drank water"],
    progressive: ["drinking water"],
    jp: {
      present: "水を 飲みます",
      past: "水を 飲みました",
      progressive: "水を 飲んでいます",
      future: "水を 飲む つもりです",
      can: "水を 飲むことが できます",
    },
  },
  {
    simple: ["read a book", "reads a book"],
    past: ["read a book"],
    progressive: ["reading a book"],
    jp: {
      present: "本を 読みます",
      past: "本を 読みました",
      progressive: "本を 読んでいます",
      future: "本を 読む つもりです",
      can: "本を 読むことが できます",
    },
  },
  {
    simple: ["write a message", "writes a message"],
    past: ["wrote a message"],
    progressive: ["writing a message"],
    jp: {
      present: "メッセージを 書きます",
      past: "メッセージを 書きました",
      progressive: "メッセージを 書いています",
      future: "メッセージを 書く つもりです",
      can: "メッセージを 書くことが できます",
    },
  },
];

function stripPunctuation(sentence) {
  return sentence.replace(/\s+[.?]$/, "").trim();
}

function splitTime(tokens) {
  const joined = tokens.join(" ");
  const timePhrases = Object.keys(timeMap).sort((a, b) => b.length - a.length);
  for (const phrase of timePhrases) {
    if (joined.endsWith(` ${phrase}`)) {
      const timeTokens = phrase.split(" ");
      return {
        coreTokens: tokens.slice(0, tokens.length - timeTokens.length),
        timeJp: timeMap[phrase],
      };
    }
    if (joined === phrase) {
      return { coreTokens: [], timeJp: timeMap[phrase] };
    }
  }
  return { coreTokens: tokens, timeJp: "" };
}

function findPhrase(phraseText, mode) {
  for (const entry of phraseEntries) {
    const aliases = entry[mode];
    if (aliases.includes(phraseText)) {
      return entry;
    }
  }
  return null;
}

function joinJp(subject, time, predicate, isQuestion) {
  const parts = [subject];
  if (time) parts.push(time);
  parts.push(predicate);
  return `${parts.join(" ")}${isQuestion ? "か。" : "。"} `;
}

function translateSentence(sentence) {
  const trimmed = stripPunctuation(sentence);
  const isQuestion = sentence.trim().endsWith("?");
  const tokens = trimmed.split(/\s+/);

  if (!tokens.length) {
    throw new Error(`Empty sentence: ${sentence}`);
  }

  const first = tokens[0];

  if (["Do", "Does", "Did"].includes(first)) {
    const subject = subjectMap[tokens[1]];
    const { coreTokens, timeJp } = splitTime(tokens.slice(2));
    const phraseText = coreTokens.join(" ");
    const mode = "simple";
    const entry = findPhrase(phraseText, mode);
    if (!entry) {
      throw new Error(`Unknown question phrase: ${sentence}`);
    }
    const predicate = first === "Did" ? entry.jp.past : entry.jp.present;
    return joinJp(subject, timeJp, predicate, true).trim();
  }

  const subject = subjectMap[tokens[0]];
  if (!subject) {
    throw new Error(`Unknown subject: ${sentence}`);
  }

  if (tokens[1] === "will") {
    const { coreTokens, timeJp } = splitTime(tokens.slice(2));
    const entry = findPhrase(coreTokens.join(" "), "simple");
    if (!entry) throw new Error(`Unknown will phrase: ${sentence}`);
    return joinJp(subject, timeJp, entry.jp.future, false).trim();
  }

  if (tokens[1] === "can") {
    const { coreTokens, timeJp } = splitTime(tokens.slice(2));
    const entry = findPhrase(coreTokens.join(" "), "simple");
    if (!entry) throw new Error(`Unknown can phrase: ${sentence}`);
    return joinJp(subject, timeJp, entry.jp.can, false).trim();
  }

  if (["am", "is", "are"].includes(tokens[1])) {
    const { coreTokens, timeJp } = splitTime(tokens.slice(2));
    const entry = findPhrase(coreTokens.join(" "), "progressive");
    if (!entry) throw new Error(`Unknown progressive phrase: ${sentence}`);
    return joinJp(subject, timeJp, entry.jp.progressive, false).trim();
  }

  const { coreTokens, timeJp } = splitTime(tokens.slice(1));
  const simpleText = coreTokens.join(" ");

  let entry = null;
  if (timeJp === "きのう") {
    entry = findPhrase(simpleText, "past");
  }
  if (entry) {
    return joinJp(subject, timeJp, entry.jp.past, false).trim();
  }

  entry = findPhrase(simpleText, "simple");
  if (entry) {
    return joinJp(subject, timeJp, entry.jp.present, false).trim();
  }

  throw new Error(`Unknown simple phrase: ${sentence}`);
}

function updateSeedFile() {
  const seedPath = path.join(rootDir, "supabase", "seed_junior_questions.sql");
  const source = fs.readFileSync(seedPath, "utf8");
  const lines = source.split(/\r?\n/);
  const updated = lines.map((line) => {
    if (!line.startsWith("('junior', ")) return line;
    const match = line.match(/^\('junior', '([^']+)', '([^']+)', ARRAY/);
    if (!match) return line;
    const sentence = match[1];
    const japanese = translateSentence(sentence).replace(/'/g, "''");
    return line.replace(match[2], japanese);
  });
  fs.writeFileSync(seedPath, updated.join("\n"));
}

async function updateLiveDb() {
  const { createClient } = require("@supabase/supabase-js");
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const { data, error } = await supabase
    .from("questions")
    .select("id,sentence,japanese")
    .eq("level", "junior");
  if (error) throw error;

  const backupPath = path.join(
    rootDir,
    "supabase",
    "backup_junior_questions_before_japanese_fix_2026-04-19.json",
  );
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

  const rows = data.map((row) => ({
    id: row.id,
    japanese: translateSentence(row.sentence),
  }));

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    for (const row of batch) {
      const { error: updateError } = await supabase
        .from("questions")
        .update({ japanese: row.japanese })
        .eq("id", row.id);
      if (updateError) throw updateError;
    }
  }
}

async function main() {
  updateSeedFile();
  await updateLiveDb();
  console.log("Updated junior Japanese translations in seed and live DB.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
