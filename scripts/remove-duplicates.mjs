// ベビーと小学生の重複単語を確認して削除するスクリプト
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://pmvtabepucegmzejkveh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdnRhYmVwdWNlZ216ZWprdmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTcxNjUsImV4cCI6MjA4ODg5MzE2NX0.CQw3XJrxY9UIRPbJsPLBa8__G7QzN5nH7B2LpCUO6Q8"
);

const DRY_RUN = process.argv[2] !== "--delete";

async function main() {
  // ベビー単語を取得
  const { data: babyWords, error: e1 } = await supabase
    .from("words")
    .select("id, word, meaning")
    .eq("level", "baby");
  if (e1) { console.error("baby fetch error:", e1); process.exit(1); }

  // 小学生単語を取得
  const { data: elemWords, error: e2 } = await supabase
    .from("words")
    .select("id, word, meaning")
    .eq("level", "elementary");
  if (e2) { console.error("elementary fetch error:", e2); process.exit(1); }

  console.log(`ベビー: ${babyWords.length}件, 小学生: ${elemWords.length}件`);

  // 重複を検出（word列の小文字比較）
  const babyWordSet = new Set(babyWords.map(w => w.word.toLowerCase()));

  const duplicates = elemWords.filter(w => babyWordSet.has(w.word.toLowerCase()));

  if (duplicates.length === 0) {
    console.log("\n重複なし。削除不要です。");
    return;
  }

  console.log(`\n重複: ${duplicates.length}件`);
  console.log("─".repeat(50));
  duplicates.forEach(w => {
    console.log(`  ${w.word.padEnd(20)} ${w.meaning}  [id: ${w.id.slice(0,8)}…]`);
  });
  console.log("─".repeat(50));

  if (DRY_RUN) {
    console.log("\n[DRY RUN] 上記を小学生リストから削除します。");
    console.log("実際に削除するには: node scripts/remove-duplicates.mjs --delete");
    return;
  }

  // 削除実行
  const ids = duplicates.map(w => w.id);
  const { error: delErr } = await supabase
    .from("words")
    .delete()
    .in("id", ids);

  if (delErr) {
    console.error("削除エラー:", delErr);
    process.exit(1);
  }

  console.log(`\n✅ ${duplicates.length}件を小学生リストから削除しました。`);
}

main();
