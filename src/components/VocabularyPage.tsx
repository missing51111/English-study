"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { THEMES, type Theme } from "@/lib/themes";

// ============================================================
// 型定義
// ============================================================
type Level = "baby" | "elementary" | "junior" | "high" | "toeic";

interface Word {
  id: string;
  level: Level;
  word: string;
  meaning: string;
  part_of_speech: string | null;
  reading: string | null;
  example_en: string | null;
  example_ja: string | null;
}

// ============================================================
// 単語 → 絵文字マップ
// ============================================================
const EMOJI_MAP: Record<string, string> = {
  // 動物
  cat: "🐱", dog: "🐶", bird: "🐦", fish: "🐟", rabbit: "🐰",
  bear: "🐻", elephant: "🐘", lion: "🦁", monkey: "🐒", duck: "🦆",
  cow: "🐄", pig: "🐷", horse: "🐴", frog: "🐸",
  bee: "🐝", ant: "🐜", fox: "🦊", hen: "🐔", goat: "🐐",
  sheep: "🐑", turtle: "🐢", mouse: "🐭", snake: "🐍", tiger: "🐯",
  // 色
  red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡", orange: "🟠",
  pink: "🩷", white: "⬜", black: "⬛", brown: "🟫", purple: "🟣",
  // 食べ物・飲み物
  apple: "🍎", banana: "🍌", milk: "🥛", juice: "🧃", bread: "🍞",
  egg: "🥚", water: "💧", cake: "🎂", rice: "🍚", cookie: "🍪",
  corn: "🌽", pear: "🍐", peach: "🍑", grape: "🍇", meat: "🥩",
  cheese: "🧀", pizza: "🍕", jam: "🍯", ice: "🧊",
  // 食器・調理
  spoon: "🥄", fork: "🍴", knife: "🔪", plate: "🍽️", bowl: "🥣", cup: "🥤",
  // からだ
  eye: "👁️", ear: "👂", nose: "👃", mouth: "👄", hand: "🤚",
  foot: "🦶", head: "🧠", face: "😊", arm: "💪", leg: "🦵",
  finger: "☝️", tooth: "🦷", toe: "🦶", feet: "🦶",
  neck: "🧣", chest: "💪", chin: "😤", cheek: "😊", hair: "💇", teeth: "🦷",
  // 家族・人
  mom: "👩", dad: "👨", baby: "👶", boy: "👦", girl: "👧",
  father: "👨", mother: "👩", brother: "👦", sister: "👧",
  friend: "🤝", family: "👨‍👩‍👧‍👦", teacher: "👩‍🏫", student: "🎓", king: "👑",
  // 数字
  one: "1️⃣", two: "2️⃣", three: "3️⃣", four: "4️⃣", five: "5️⃣",
  six: "6️⃣", seven: "7️⃣", eight: "8️⃣", nine: "9️⃣", ten: "🔟",
  // 動作（baby）
  eat: "🍽️", drink: "🥤", play: "🎮", sleep: "😴", run: "🏃", jump: "🦘",
  sit: "🪑", sing: "🎤", smile: "😊", kick: "🦵", spin: "🌀",
  clap: "👏", hug: "🤗", wave: "👋", open: "🔓",
  // 動作（elementary）
  go: "🚶", come: "👋", study: "📚", read: "📖", write: "✍️",
  walk: "🚶", swim: "🏊", cook: "👨‍🍳", buy: "🛒", sell: "💰",
  help: "🤝", like: "👍", love: "❤️", want: "🙏", have: "📦",
  know: "💡", see: "👀", hear: "👂", speak: "💬", think: "💭",
  // 自然・天気
  sun: "☀️", moon: "🌙", star: "⭐", cloud: "☁️",
  rain: "🌧️", snow: "❄️", wind: "💨", flower: "🌸",
  tree: "🌳", leaf: "🍃", grass: "🌿", sand: "🏖️",
  stone: "🪨", hill: "⛰️",
  // 天気（形容詞）
  sunny: "☀️", cloudy: "☁️", rainy: "🌧️", snowy: "❄️",
  windy: "💨", hot: "🥵", cold: "🥶", warm: "🌤️",
  // 家・もの
  house: "🏠", door: "🚪", gate: "🚪", bed: "🛏️", chair: "🪑",
  desk: "🪑", lamp: "💡", fan: "💨", bell: "🔔", box: "📦",
  bag: "🎒", hat: "🎩", sock: "🧦", shoe: "👟", coat: "🧥",
  shirt: "👕", pants: "👖", vest: "🦺",
  toy: "🧸", ball: "🏐", bat: "⚾", drum: "🥁", flag: "🚩",
  pen: "🖊️", book: "📖", pencil: "✏️",
  bone: "🦴", nest: "🪺", wing: "🪽", tail: "🐾",
  pool: "🏊", well: "🪣", road: "🛣️", net: "🥅",
  gift: "🎁", soap: "🧼",
  // 乗り物
  car: "🚗", bus: "🚌", train: "🚆", plane: "✈️",
  boat: "⛵", bike: "🚲",
  // 動物園・自然
  zoo: "🦁",
  // 学校
  school: "🏫", test: "📝", homework: "📚",
  // 教科
  math: "➕", science: "🔬", music: "🎵", art: "🎨",
  // 時間
  morning: "🌅", afternoon: "☀️", evening: "🌆", night: "🌙",
  today: "📅", week: "🗓️", month: "📆", year: "🎊",
  // スポーツ・趣味
  soccer: "⚽", baseball: "⚾", basketball: "🏀", swimming: "🏊",
  tennis: "🎾", cooking: "🍳", reading: "📖", drawing: "🖌️",
  // 形容詞（elementary）
  fast: "⚡", slow: "🐢", happy: "😊", sad: "😢", big: "🐘",
  angry: "😠", tired: "😪", hungry: "🤤", cute: "🥰",
  kind: "🤝", strong: "💪",
  // 場所
  park: "🏞️", hospital: "🏥", library: "📚", store: "🏪",
  // 自然（junior）
  forest: "🌲", ocean: "🌊", mountain: "⛰️", river: "🏞️", island: "🏝️",
  climate: "🌡️", pollution: "🏭", energy: "⚡", recycle: "♻️",
  // 旅行
  airport: "✈️", hotel: "🏨", station: "🚉", ticket: "🎫",
  passport: "🛂", departure: "🛫", arrival: "🛬", tourist: "📸",
  destination: "📍",
  // 社会・文化
  culture: "🎭", tradition: "🏺", history: "📜", environment: "🌍",
  technology: "💻", education: "🎓", government: "🏛️", community: "👥",
  // コミュニケーション
  message: "💬", interview: "🎤", speech: "🎤", discussion: "💬",
  opinion: "💭", agree: "👍", disagree: "👎", understand: "💡",
  // 動詞（junior）
  improve: "📈", develop: "🌱", support: "🤝", discover: "🔭",
  reduce: "📉", practice: "🏋️", prepare: "📋", achieve: "🏆",
  protect: "🛡️",
  // 感情・状態
  problem: "❓", solution: "💡", result: "📊", success: "🏆",
  future: "🔮", dream: "💭", goal: "🎯", challenge: "🎯",
  mistake: "❌", opportunity: "🚪",
  // 健康
  medicine: "💊", health: "💪", exercise: "🏃", stress: "😰",
  // high school
  innovation: "💡", democracy: "🗳️", globalization: "🌍",
  sustainability: "♻️", inequality: "⚖️", discrimination: "🚫",
  hypothesis: "🧪", phenomenon: "🌟", paradox: "♾️",
  metaphor: "💬", consensus: "🤝", ethics: "⚖️", integrity: "💎",
  diverse: "🌈", generate: "⚡", investigate: "🔍",
  // TOEIC
  agenda: "📋", budget: "💰", deadline: "⏰", invoice: "📄",
  revenue: "💰", profit: "📈", expense: "💸", asset: "💎",
  recruit: "📢", resign: "🚪", promote: "📈", retire: "🌅",
  performance: "📊", salary: "💰", benefit: "🎁",
  department: "🏢", headquarters: "🏢", merger: "🤝",
  postpone: "⏰", reschedule: "📅", correspond: "✉️",
  collaborate: "🤝", minutes: "📋", attendee: "👥",
  conference: "🏛️", milestone: "🎯", deliverable: "📦",
  stakeholder: "👥", timeline: "⏱️", priority: "⭐",
  monitor: "👀", outsource: "🌐", client: "🤝",
  vendor: "🏪", supplier: "📦", contractor: "👷",
  comply: "✅", terminate: "❌", renew: "🔄", liability: "⚖️",
  audit: "🔍", transaction: "💳", reimburse: "💰",
  overhead: "📊", turnover: "🔄", projection: "📊",
  leverage: "💪",
};

// ============================================================
// レベル表示設定
// ============================================================
const LEVELS: { id: Level; label: string; color: string; bg: string; badge: string; emojiBg: string }[] = [
  { id: "baby",        label: "ベビー",   color: "text-pink-600",   bg: "bg-pink-50",   badge: "bg-pink-500",   emojiBg: "bg-pink-100" },
  { id: "elementary", label: "小学生",   color: "text-yellow-600", bg: "bg-yellow-50", badge: "bg-yellow-500", emojiBg: "bg-yellow-100" },
  { id: "junior",     label: "中学生",   color: "text-blue-600",   bg: "bg-blue-50",   badge: "bg-blue-500",   emojiBg: "bg-blue-100" },
  { id: "high",       label: "高校生",   color: "text-purple-600", bg: "bg-purple-50", badge: "bg-purple-500", emojiBg: "bg-purple-100" },
  { id: "toeic",      label: "TOEIC",    color: "text-gray-600",   bg: "bg-gray-50",   badge: "bg-gray-600",   emojiBg: "bg-gray-100" },
];

// ============================================================
// モックデータ（Supabase 未設定時のフォールバック）
// ============================================================
const MOCK_WORDS: Word[] = [
  { id: "1", level: "baby",       word: "cat",         meaning: "ねこ",     part_of_speech: "noun", reading: "キャット", example_en: null, example_ja: null },
  { id: "2", level: "baby",       word: "dog",         meaning: "いぬ",     part_of_speech: "noun", reading: "ドッグ",   example_en: null, example_ja: null },
  { id: "3", level: "baby",       word: "red",         meaning: "あかい",   part_of_speech: "adj",  reading: "レッド",   example_en: null, example_ja: null },
  { id: "4", level: "elementary", word: "school",      meaning: "学校",     part_of_speech: "noun", reading: null,       example_en: null, example_ja: null },
  { id: "5", level: "elementary", word: "teacher",     meaning: "先生",     part_of_speech: "noun", reading: null,       example_en: null, example_ja: null },
  { id: "6", level: "junior",     word: "environment", meaning: "環境",     part_of_speech: "noun", reading: null,       example_en: null, example_ja: null },
  { id: "7", level: "high",       word: "analyze",     meaning: "分析する", part_of_speech: "verb", reading: null,       example_en: null, example_ja: null },
  { id: "8", level: "toeic",      word: "deadline",    meaning: "締め切り", part_of_speech: "noun", reading: null,       example_en: null, example_ja: null },
];

// ============================================================
// メインコンポーネント
// ============================================================
type SortOrder = "az" | "kana";

export default function VocabularyPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<Level>("baby");
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");
  const [wordsByLevel, setWordsByLevel] = useState<Record<Level, Word[]>>({
    baby: [], elementary: [], junior: [], high: [], toeic: [],
  });
  const [loading, setLoading] = useState(true);
  const [themeId, setThemeId] = useState("pink");

  // localStorageからテーマを読み込む（useLayoutEffectで点滅を防止）
  useLayoutEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved && THEMES.find(th => th.id === saved)) setThemeId(saved);
  }, []);

  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true);
      try {
        // レベルごとに個別クエリ（サーバー側1000件制限を回避）
        const levels: Level[] = ["baby", "elementary", "junior", "high", "toeic"];
        const results: Record<Level, Word[]> = {
          baby: [], elementary: [], junior: [], high: [], toeic: [],
        };
        await Promise.all(
          levels.map(async (level) => {
            const { data } = await supabase
              .from("words")
              .select("*")
              .eq("level", level)
              .order("word", { ascending: true });
            if (data) results[level] = data as Word[];
          })
        );
        const total = Object.values(results).reduce((s, arr) => s + arr.length, 0);
        if (total === 0) {
          setWordsByLevel(groupByLevel(MOCK_WORDS));
        } else {
          setWordsByLevel(results);
        }
      } catch {
        setWordsByLevel(groupByLevel(MOCK_WORDS));
      } finally {
        setLoading(false);
      }
    };
    fetchWords();
  }, []);

  const groupByLevel = (words: Word[]): Record<Level, Word[]> => {
    const result: Record<Level, Word[]> = {
      baby: [], elementary: [], junior: [], high: [], toeic: [],
    };
    for (const w of words) {
      if (result[w.level]) result[w.level].push(w);
    }
    return result;
  };

  const t: Theme = THEMES.find((th) => th.id === themeId) ?? THEMES[0];
  const currentLevel = LEVELS.find((l) => l.id === selectedLevel) ?? LEVELS[0];
  const totalCount = Object.values(wordsByLevel).reduce((s, arr) => s + arr.length, 0);

  const rawWords = wordsByLevel[selectedLevel] ?? [];
  const currentWords = [...rawWords].sort((a, b) =>
    sortOrder === "az"
      ? a.word.localeCompare(b.word)
      : a.meaning.localeCompare(b.meaning, "ja")
  );

  return (
    <div className={`min-h-screen ${t.bg}`}>
      {/* ヘッダー */}
      <header className={`${t.nav} border-b ${t.navBorder} sticky top-0 z-10`}>
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={() => router.push("/")}
            className={`${t.subText} text-xl leading-none`}
            aria-label="戻る"
          >
            ←
          </button>
          <h1 className={`font-bold ${t.titleText} text-lg flex-1`}>単語帳</h1>
          <span className={`text-sm ${t.subText}`}>全 {totalCount} 語</span>
        </div>

        {/* レベルタブ */}
        <div className={`flex border-t ${t.navBorder} overflow-x-auto`}>
          {LEVELS.map((lv) => {
            const count = wordsByLevel[lv.id]?.length ?? 0;
            const isActive = selectedLevel === lv.id;
            return (
              <button
                key={lv.id}
                onClick={() => setSelectedLevel(lv.id)}
                className={`flex-1 min-w-[4rem] py-2 text-xs font-medium border-b-2 transition-colors ${
                  isActive ? `${t.navActive} border-current` : `${t.navInactive} border-transparent`
                }`}
              >
                <div>{lv.label}</div>
                <div className={`text-[10px] mt-0.5 ${isActive ? t.navActive : t.navInactive}`}>
                  {count}語
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* コンテンツ */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            読み込み中...
          </div>
        ) : currentWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <span className="text-4xl">📚</span>
            <p className="text-sm">単語データがありません</p>
            <p className="text-xs text-gray-300">seed_vocabulary.sql を Supabase で実行してください</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${t.bar}`}>
                {currentLevel.label}
              </span>
              <span className={`text-xs ${t.subText}`}>{currentWords.length}語</span>
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => setSortOrder("az")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    sortOrder === "az"
                      ? `${t.bar} text-white`
                      : `${t.card} ${t.bodyText} border ${t.border}`
                  }`}
                >
                  A-Z
                </button>
                <button
                  onClick={() => setSortOrder("kana")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    sortOrder === "kana"
                      ? `${t.bar} text-white`
                      : `${t.card} ${t.bodyText} border ${t.border}`
                  }`}
                >
                  あ-ん
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {currentWords.map((w) => (
                <WordCard
                  key={w.id}
                  word={w}
                  level={selectedLevel}
                  levelColor={t.navActive}
                  emojiBg={t.innerCard}
                  t={t}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// 品詞の日本語変換（DBの値: noun/verb/adj/adv/phrase）
const POS_JA: Record<string, string> = {
  noun:    "名詞",
  verb:    "動詞",
  adj:     "形容詞",
  adv:     "副詞",
  phrase:  "フレーズ",
  conj:    "接続詞",
  prep:    "前置詞",
};

// ベビー向けひらがな品詞
const POS_BABY: Record<string, string> = {
  noun:   "なまえ",
  verb:   "うごき",
  adj:    "ようす",
  adv:    "ようすの\nことば",
  phrase: "ひとこと",
};

// 品詞バッジの色
const POS_COLOR: Record<string, string> = {
  noun:   "bg-blue-100 text-blue-700",
  verb:   "bg-green-100 text-green-700",
  adj:    "bg-orange-100 text-orange-700",
  adv:    "bg-purple-100 text-purple-700",
  phrase: "bg-pink-100 text-pink-700",
  conj:   "bg-teal-100 text-teal-700",
  prep:   "bg-gray-100 text-gray-600",
};

// ============================================================
// 単語カード
// ============================================================
function WordCard({
  word,
  level,
  emojiBg,
  t,
}: {
  word: Word;
  level: Level;
  levelColor: string;
  emojiBg: string;
  t: Theme;
}) {
  const emoji = EMOJI_MAP[word.word.toLowerCase()] ?? null;
  const pos = word.part_of_speech ?? null;
  const posLabel = pos
    ? level === "baby"
      ? (POS_BABY[pos] ?? null)
      : (POS_JA[pos] ?? null)
    : null;
  const posColor = pos ? (POS_COLOR[pos] ?? "bg-gray-100 text-gray-600") : null;

  return (
    <div className={`rounded-xl border ${t.border} ${t.card} shadow-sm flex items-stretch overflow-hidden`}>
      {/* 左：上段=品詞＋日本語、下段=英語（大） */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 px-3 py-2.5">
        {/* 上段：日本語＋品詞バッジ */}
        <div className="flex items-center gap-1.5 min-w-0">
          <p className={`${t.subText} text-sm leading-none truncate`}>{word.meaning}</p>
          {posLabel && (
            <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 font-bold leading-none ${posColor} ${level === "baby" ? "text-[9px]" : "text-[10px]"}`}>
              {posLabel.replace("\n", "")}
            </span>
          )}
        </div>
        {/* 下段：英語（大きく） */}
        <p className={`font-bold ${t.bodyText} text-xl leading-tight break-all`}>
          {word.word}
        </p>
      </div>

      {/* 右：絵文字（カード高さいっぱいに広げる） */}
      {emoji ? (
        <div className={`${emojiBg} flex items-center justify-center flex-shrink-0`}
          style={{ width: "4rem" }}>
          <span style={{ fontSize: "2.25rem", lineHeight: 1 }}>{emoji}</span>
        </div>
      ) : (
        <div style={{ width: "0.75rem" }} />
      )}
    </div>
  );
}
