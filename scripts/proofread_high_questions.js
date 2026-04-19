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

const sentenceFixes = new Map([
  [
    "It goes without saying that health is above wealth .",
    {
      sentence: "It goes without saying that health is more important than wealth .",
      words: [
        "It",
        "goes",
        "without",
        "saying",
        "that",
        "health",
        "is",
        "more",
        "important",
        "than",
        "wealth",
      ],
      japanese: "健康が富より大切なことは言うまでもありません。",
      hint: "It goes without saying that = ～は言うまでもない",
    },
  ],
]);

function applyFix(row) {
  const fix = sentenceFixes.get(row.sentence);
  if (!fix) return row;
  return {
    ...row,
    sentence: fix.sentence,
    words: fix.words,
    japanese: fix.japanese ?? row.japanese,
    hint: fix.hint ?? row.hint,
  };
}

function generateSeed(rows) {
  const lines = [
    "-- ============================================================",
    "-- 高校レベル問題 seed",
    "-- source: live high questions after proofreading",
    "-- ============================================================",
    "",
    "DELETE FROM questions WHERE level = 'high';",
    "",
    "INSERT INTO questions (level, sentence, japanese, words, punctuation, hint) VALUES",
  ];

  rows.forEach((row, index) => {
    const suffix = index === rows.length - 1 ? ";" : ",";
    lines.push(
      `(${sqlQuote("high")}, ${sqlQuote(row.sentence)}, ${sqlQuote(
        row.japanese,
      )}, ${arraySql(row.words)}, ${sqlQuote(row.punctuation)}, ${sqlQuote(
        row.hint ?? "",
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

  const { data, error } = await supabase
    .from("questions")
    .select("id,level,sentence,japanese,words,punctuation,hint,created_at")
    .eq("level", "high")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const backupPath = path.join(
    rootDir,
    "supabase",
    "backup_high_questions_before_proofread_2026-04-19.json",
  );
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

  const fixedRows = data.map(applyFix);
  const changedRows = fixedRows.filter(
    (row, index) =>
      row.sentence !== data[index].sentence ||
      JSON.stringify(row.words) !== JSON.stringify(data[index].words) ||
      row.japanese !== data[index].japanese ||
      row.hint !== data[index].hint,
  );

  for (const row of changedRows) {
    const { error: updateError } = await supabase
      .from("questions")
      .update({
        sentence: row.sentence,
        words: row.words,
        japanese: row.japanese,
        hint: row.hint,
      })
      .eq("id", row.id);
    if (updateError) throw updateError;
  }

  const seedPath = path.join(rootDir, "supabase", "seed_high_questions.sql");
  fs.writeFileSync(seedPath, generateSeed(fixedRows));

  console.log(
    JSON.stringify(
      {
        total: data.length,
        changed: changedRows.length,
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
