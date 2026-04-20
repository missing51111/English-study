const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

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

function sqlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function arraySql(values) {
  return `ARRAY[${values.map(sqlQuote).join(", ")}]`;
}

const phrases = [
  {
    key: "homework",
    base: "do homework",
    third: "does homework",
    past: "did homework",
    ing: "doing homework",
    jp: {
      present: "宿題をします",
      negative: "宿題をしません",
      progressive: "宿題をしています",
      past: "宿題をしました",
      future: "宿題をする予定です",
      can: "宿題をすることができます",
    },
  },
  {
    key: "studyEnglish",
    base: "study English",
    third: "studies English",
    past: "studied English",
    ing: "studying English",
    jp: {
      present: "英語を勉強します",
      negative: "英語を勉強しません",
      progressive: "英語を勉強しています",
      past: "英語を勉強しました",
      future: "英語を勉強する予定です",
      can: "英語を勉強することができます",
    },
  },
  {
    key: "playSoccer",
    base: "play soccer",
    third: "plays soccer",
    past: "played soccer",
    ing: "playing soccer",
    jp: {
      present: "サッカーをします",
      negative: "サッカーをしません",
      progressive: "サッカーをしています",
      past: "サッカーをしました",
      future: "サッカーをする予定です",
      can: "サッカーをすることができます",
    },
  },
  {
    key: "practiceTennis",
    base: "practice tennis",
    third: "practices tennis",
    past: "practiced tennis",
    ing: "practicing tennis",
    jp: {
      present: "テニスを練習します",
      negative: "テニスを練習しません",
      progressive: "テニスを練習しています",
      past: "テニスを練習しました",
      future: "テニスを練習する予定です",
      can: "テニスを練習することができます",
    },
  },
  {
    key: "listenMusic",
    base: "listen to music",
    third: "listens to music",
    past: "listened to music",
    ing: "listening to music",
    jp: {
      present: "音楽を聞きます",
      negative: "音楽を聞きません",
      progressive: "音楽を聞いています",
      past: "音楽を聞きました",
      future: "音楽を聞く予定です",
      can: "音楽を聞くことができます",
    },
  },
  {
    key: "watchTv",
    base: "watch TV",
    third: "watches TV",
    past: "watched TV",
    ing: "watching TV",
    jp: {
      present: "テレビを見ます",
      negative: "テレビを見ません",
      progressive: "テレビを見ています",
      past: "テレビを見ました",
      future: "テレビを見る予定です",
      can: "テレビを見ることができます",
    },
  },
  {
    key: "readBook",
    base: "read a book",
    third: "reads a book",
    past: "read a book",
    ing: "reading a book",
    jp: {
      present: "本を読みます",
      negative: "本を読みません",
      progressive: "本を読んでいます",
      past: "本を読みました",
      future: "本を読む予定です",
      can: "本を読むことができます",
    },
  },
  {
    key: "writeMessage",
    base: "write a message",
    third: "writes a message",
    past: "wrote a message",
    ing: "writing a message",
    jp: {
      present: "メッセージを書きます",
      negative: "メッセージを書きません",
      progressive: "メッセージを書いています",
      past: "メッセージを書きました",
      future: "メッセージを書く予定です",
      can: "メッセージを書くことができます",
    },
  },
  {
    key: "cleanClassroom",
    base: "clean the classroom",
    third: "cleans the classroom",
    past: "cleaned the classroom",
    ing: "cleaning the classroom",
    jp: {
      present: "教室を掃除します",
      negative: "教室を掃除しません",
      progressive: "教室を掃除しています",
      past: "教室を掃除しました",
      future: "教室を掃除する予定です",
      can: "教室を掃除することができます",
    },
  },
  {
    key: "washDishes",
    base: "wash the dishes",
    third: "washes the dishes",
    past: "washed the dishes",
    ing: "washing the dishes",
    jp: {
      present: "皿を洗います",
      negative: "皿を洗いません",
      progressive: "皿を洗っています",
      past: "皿を洗いました",
      future: "皿を洗う予定です",
      can: "皿を洗うことができます",
    },
  },
  {
    key: "helpAtHome",
    base: "help at home",
    third: "helps at home",
    past: "helped at home",
    ing: "helping at home",
    jp: {
      present: "家で手伝います",
      negative: "家で手伝いません",
      progressive: "家で手伝っています",
      past: "家で手伝いました",
      future: "家で手伝う予定です",
      can: "家で手伝うことができます",
    },
  },
  {
    key: "useComputer",
    base: "use the computer",
    third: "uses the computer",
    past: "used the computer",
    ing: "using the computer",
    jp: {
      present: "パソコンを使います",
      negative: "パソコンを使いません",
      progressive: "パソコンを使っています",
      past: "パソコンを使いました",
      future: "パソコンを使う予定です",
      can: "パソコンを使うことができます",
    },
  },
  {
    key: "openWindow",
    base: "open the window",
    third: "opens the window",
    past: "opened the window",
    ing: "opening the window",
    jp: {
      present: "窓を開けます",
      negative: "窓を開けません",
      progressive: "窓を開けています",
      past: "窓を開けました",
      future: "窓を開ける予定です",
      can: "窓を開けることができます",
    },
  },
  {
    key: "closeDoor",
    base: "close the door",
    third: "closes the door",
    past: "closed the door",
    ing: "closing the door",
    jp: {
      present: "ドアを閉めます",
      negative: "ドアを閉めません",
      progressive: "ドアを閉めています",
      past: "ドアを閉めました",
      future: "ドアを閉める予定です",
      can: "ドアを閉めることができます",
    },
  },
  {
    key: "takeShower",
    base: "take a shower",
    third: "takes a shower",
    past: "took a shower",
    ing: "taking a shower",
    jp: {
      present: "シャワーを浴びます",
      negative: "シャワーを浴びません",
      progressive: "シャワーを浴びています",
      past: "シャワーを浴びました",
      future: "シャワーを浴びる予定です",
      can: "シャワーを浴びることができます",
    },
  },
  {
    key: "walkStation",
    base: "walk to the station",
    third: "walks to the station",
    past: "walked to the station",
    ing: "walking to the station",
    jp: {
      present: "駅まで歩きます",
      negative: "駅まで歩きません",
      progressive: "駅まで歩いています",
      past: "駅まで歩きました",
      future: "駅まで歩く予定です",
      can: "駅まで歩くことができます",
    },
  },
  {
    key: "goLibrary",
    base: "go to the library",
    third: "goes to the library",
    past: "went to the library",
    ing: "going to the library",
    jp: {
      present: "図書館へ行きます",
      negative: "図書館へ行きません",
      progressive: "図書館へ向かっています",
      past: "図書館へ行きました",
      future: "図書館へ行く予定です",
      can: "図書館へ行くことができます",
    },
  },
  {
    key: "waitBus",
    base: "wait for the bus",
    third: "waits for the bus",
    past: "waited for the bus",
    ing: "waiting for the bus",
    jp: {
      present: "バスを待ちます",
      negative: "バスを待ちません",
      progressive: "バスを待っています",
      past: "バスを待ちました",
      future: "バスを待つ予定です",
      can: "バスを待つことができます",
    },
  },
  {
    key: "buyNotebook",
    base: "buy a notebook",
    third: "buys a notebook",
    past: "bought a notebook",
    ing: "buying a notebook",
    jp: {
      present: "ノートを買います",
      negative: "ノートを買いません",
      progressive: "ノートを買っています",
      past: "ノートを買いました",
      future: "ノートを買う予定です",
      can: "ノートを買うことができます",
    },
  },
  {
    key: "drinkWater",
    base: "drink water",
    third: "drinks water",
    past: "drank water",
    ing: "drinking water",
    jp: {
      present: "水を飲みます",
      negative: "水を飲みません",
      progressive: "水を飲んでいます",
      past: "水を飲みました",
      future: "水を飲む予定です",
      can: "水を飲むことができます",
    },
  },
  {
    key: "meetFriends",
    base: "meet friends",
    third: "meets friends",
    past: "met friends",
    ing: "meeting friends",
    jp: {
      present: "友だちに会います",
      negative: "友だちに会いません",
      progressive: "友だちに会っています",
      past: "友だちに会いました",
      future: "友だちに会う予定です",
      can: "友だちに会うことができます",
    },
  },
  {
    key: "practicePiano",
    base: "practice the piano",
    third: "practices the piano",
    past: "practiced the piano",
    ing: "practicing the piano",
    jp: {
      present: "ピアノを練習します",
      negative: "ピアノを練習しません",
      progressive: "ピアノを練習しています",
      past: "ピアノを練習しました",
      future: "ピアノを練習する予定です",
      can: "ピアノを練習することができます",
    },
  },
  {
    key: "talkTeacher",
    base: "talk with the teacher",
    third: "talks with the teacher",
    past: "talked with the teacher",
    ing: "talking with the teacher",
    jp: {
      present: "先生と話します",
      negative: "先生と話しません",
      progressive: "先生と話しています",
      past: "先生と話しました",
      future: "先生と話す予定です",
      can: "先生と話すことができます",
    },
  },
  {
    key: "goShopping",
    base: "go shopping",
    third: "goes shopping",
    past: "went shopping",
    ing: "going shopping",
    jp: {
      present: "買い物に行きます",
      negative: "買い物に行きません",
      progressive: "買い物に行っています",
      past: "買い物に行きました",
      future: "買い物に行く予定です",
      can: "買い物に行くことができます",
    },
  },
  {
    key: "runPark",
    base: "run in the park",
    third: "runs in the park",
    past: "ran in the park",
    ing: "running in the park",
    jp: {
      present: "公園で走ります",
      negative: "公園で走りません",
      progressive: "公園で走っています",
      past: "公園で走りました",
      future: "公園で走る予定です",
      can: "公園で走ることができます",
    },
  },
];

const templates = [
  {
    key: "presentA",
    buildEn: (p) => `I ${p.base} after school .`,
    buildJp: (p) => `私は放課後 ${p.jp.present}。`,
    hint: "現在形",
  },
  {
    key: "presentB",
    buildEn: (p) => `You ${p.base} every day .`,
    buildJp: (p) => `あなたは毎日 ${p.jp.present}。`,
    hint: "現在形",
  },
  {
    key: "presentC",
    buildEn: (p) => `He ${p.third} every morning .`,
    buildJp: (p) => `彼は毎朝 ${p.jp.present}。`,
    hint: "現在形",
  },
  {
    key: "presentD",
    buildEn: (p) => `She ${p.third} on Sundays .`,
    buildJp: (p) => `彼女は日曜日に ${p.jp.present}。`,
    hint: "現在形",
  },
  {
    key: "presentE",
    buildEn: (p) => `We ${p.base} after school .`,
    buildJp: (p) => `私たちは放課後 ${p.jp.present}。`,
    hint: "現在形",
  },
  {
    key: "presentF",
    buildEn: (p) => `They ${p.base} on weekends .`,
    buildJp: (p) => `彼らは週末に ${p.jp.present}。`,
    hint: "現在形",
  },
  {
    key: "questionA",
    buildEn: (p) => `Do you ${p.base} after school ?`,
    buildJp: (p) => `あなたは放課後 ${p.jp.present}か。`,
    hint: "疑問文",
  },
  {
    key: "questionB",
    buildEn: (p) => `Does she ${p.base} every day ?`,
    buildJp: (p) => `彼女は毎日 ${p.jp.present}か。`,
    hint: "疑問文",
  },
  {
    key: "negativeA",
    buildEn: (p) => `I do not ${p.base} today .`,
    buildJp: (p) => `私は今日は ${p.jp.negative}。`,
    hint: "否定文",
  },
  {
    key: "negativeB",
    buildEn: (p) => `We do not ${p.base} on Sundays .`,
    buildJp: (p) => `私たちは日曜日に ${p.jp.negative}。`,
    hint: "否定文",
  },
  {
    key: "progressiveA",
    buildEn: (p) => `I am ${p.ing} now .`,
    buildJp: (p) => `私は今 ${p.jp.progressive}。`,
    hint: "現在進行形",
  },
  {
    key: "progressiveB",
    buildEn: (p) => `They are ${p.ing} now .`,
    buildJp: (p) => `彼らは今 ${p.jp.progressive}。`,
    hint: "現在進行形",
  },
  {
    key: "pastA",
    buildEn: (p) => `He ${p.past} yesterday .`,
    buildJp: (p) => `彼は昨日 ${p.jp.past}。`,
    hint: "過去形",
  },
  {
    key: "futureA",
    buildEn: (p) => `We will ${p.base} tomorrow .`,
    buildJp: (p) => `私たちは明日 ${p.jp.future}。`,
    hint: "will",
  },
  {
    key: "canA",
    buildEn: (p) => `I can ${p.base} after school .`,
    buildJp: (p) => `私は放課後 ${p.jp.can}。`,
    hint: "can",
  },
  {
    key: "canQ",
    buildEn: (p) => `Can you ${p.base} today ?`,
    buildJp: (p) => `あなたは今日 ${p.jp.can}か。`,
    hint: "can",
  },
];

function sentenceToWords(sentence, punctuation) {
  const body = sentence.slice(0, -2).trim();
  return body.split(/\s+/);
}

function generateRows() {
  const rows = [];
  for (const template of templates) {
    for (const phrase of phrases) {
      const punctuation = template.buildEn(phrase).trim().endsWith("?") ? "?" : ".";
      const sentence = template.buildEn(phrase);
      rows.push({
        level: "junior",
        sentence,
        japanese: template.buildJp(phrase),
        words: sentenceToWords(sentence, punctuation),
        punctuation,
        hint: template.hint,
      });
    }
  }
  return rows;
}

function buildSeed(rows) {
  const lines = [
    "-- ============================================================",
    "-- junior 400問 seed",
    "-- regenerated for natural daily-conversation context",
    "-- ============================================================",
    "",
    "DELETE FROM questions WHERE level = 'junior';",
    "",
    "INSERT INTO questions (level, sentence, japanese, words, punctuation, hint) VALUES",
  ];

  rows.forEach((row, index) => {
    const suffix = index === rows.length - 1 ? ";" : ",";
    lines.push(
      `(${sqlQuote(row.level)}, ${sqlQuote(row.sentence)}, ${sqlQuote(
        row.japanese,
      )}, ${arraySql(row.words)}, ${sqlQuote(row.punctuation)}, ${sqlQuote(
        row.hint,
      )})${suffix}`,
    );
  });
  lines.push("");
  return lines.join("\n");
}

async function main() {
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const rows = generateRows();
  if (rows.length !== 400) {
    throw new Error(`Expected 400 rows, got ${rows.length}`);
  }

  const { data: currentRows, error } = await supabase
    .from("questions")
    .select("id,created_at,sentence,japanese,words,punctuation,hint")
    .eq("level", "junior")
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (currentRows.length !== rows.length) {
    throw new Error(`Current DB has ${currentRows.length} junior rows, expected 400`);
  }

  const backupPath = path.join(
    rootDir,
    "supabase",
    "backup_junior_questions_before_context_regen_2026-04-20.json",
  );
  fs.writeFileSync(backupPath, JSON.stringify(currentRows, null, 2));

  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25);
    const currentBatch = currentRows.slice(i, i + 25);
    for (let j = 0; j < batch.length; j += 1) {
      const next = batch[j];
      const current = currentBatch[j];
      const { error: updateError } = await supabase
        .from("questions")
        .update({
          sentence: next.sentence,
          japanese: next.japanese,
          words: next.words,
          punctuation: next.punctuation,
          hint: next.hint,
        })
        .eq("id", current.id);
      if (updateError) throw updateError;
    }
  }

  const seedPath = path.join(rootDir, "supabase", "seed_junior_questions.sql");
  fs.writeFileSync(seedPath, buildSeed(rows));

  console.log(
    JSON.stringify(
      {
        updated: rows.length,
        backupPath,
        seedPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
