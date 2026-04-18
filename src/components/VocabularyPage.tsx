"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { THEMES, type Theme } from "@/lib/themes";
import { EMOJI_MAP } from "@/lib/emojiMap";
import { GENERATED_WORD_IMAGE_MANIFEST } from "@/lib/generatedWordImages";
import VocabularyWordCard from "@/components/VocabularyWordCard";
import {
  VOCABULARY_LEVEL_TARGETS,
  getRemainingVocabularyCount,
  getVocabularyFocusLabel,
  isPhraseItem,
  isTestableWordItem,
  primaryPartOfSpeech,
  sortWordsForDisplay,
} from "@/lib/vocabularyPlan";

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
  image_name?: string | null;
  image_status?: string | null;
}

function applyGeneratedWordImage<T extends Word>(word: T): T {
  const generatedImage = GENERATED_WORD_IMAGE_MANIFEST[word.id];
  if (!generatedImage) return word;

  return {
    ...word,
    image_name: generatedImage.imageName,
    image_status: generatedImage.imageStatus,
  };
}

interface TestLetter {
  id: number;
  ch: string;
  used: boolean;
  shaking: boolean;
}

// ============================================================
// 単語 → 絵文字マップ
// ============================================================

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
// ユーティリティ
// ============================================================
function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function make3Dummies(word: string): string[] {
  const used = new Set(word.toLowerCase().split(""));
  const pool = shuffleArr("abcdefghijklmnopqrstuvwxyz".split("").filter(l => !used.has(l)));
  return pool.slice(0, 3);
}

function buildTestLetters(word: Word): TestLetter[] {
  const letters = word.word.toLowerCase().split("");
  const dummies = make3Dummies(word.word);
  const all = shuffleArr([...letters, ...dummies]);
  return all.map((ch, i) => ({ id: i, ch, used: false, shaking: false }));
}

// ============================================================
// メインコンポーネント
// ============================================================
type SortOrder = "recommended" | "az" | "kana";

export default function VocabularyPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<Level>("baby");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recommended");
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [wordsByLevel, setWordsByLevel] = useState<Record<Level, Word[]>>({
    baby: [], elementary: [], junior: [], high: [], toeic: [],
  });
  const [loading, setLoading] = useState(true);
  const [themeId, setThemeId] = useState("pink");
  const [acquiredWords, setAcquiredWords] = useState<Set<string>>(new Set());
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(100);

  // ── テストモード ────────────────────────────────────────────
  const [testMode, setTestMode]       = useState(false);
  const [testWord, setTestWord]       = useState<Word | null>(null);
  const [testBuilt, setTestBuilt]     = useState<string[]>([]);
  const [testLetters, setTestLetters] = useState<TestLetter[]>([]);
  const [streak, setStreak]           = useState(0);
  const [bestStreakMap, setBestStreakMap] = useState<Record<Level, number>>({
    baby: 0, elementary: 0, junior: 0, high: 0, toeic: 0,
  });
  const [testCorrect, setTestCorrect] = useState(false);
  const [lives, setLives]             = useState(3);
  const [testGameOver, setTestGameOver] = useState(false);
  const [testShowAnswer, setTestShowAnswer] = useState(false);
  const [testPool, setTestPool]       = useState<Word[] | null>(null); // ふくしゅう用プール
  const [wrongWordList, setWrongWordList] = useState<string[]>([]); // 間違えた単語リスト
  const [ticketReward, setTicketReward] = useState<{ count: number; reason: string } | null>(null);
  const [lastMilestone, setLastMilestone] = useState(0);
  const [fullClearDone, setFullClearDone] = useState(false);

  // localStorageからテーマ・取得済み単語を読み込む
  useLayoutEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved && THEMES.find(th => th.id === saved)) setThemeId(saved);
    const savedLevel = localStorage.getItem("level") as Level | null;
    if (savedLevel && LEVELS.find(l => l.id === savedLevel)) setSelectedLevel(savedLevel);
    const savedAcq = localStorage.getItem("acquiredWords");
    if (savedAcq) {
      try { setAcquiredWords(new Set(JSON.parse(savedAcq))); } catch { /* ignore */ }
    }
    const savedBest = localStorage.getItem("vocabBestStreak");
    if (savedBest) {
      try {
        const parsed = JSON.parse(savedBest);
        if (typeof parsed === "object" && parsed !== null) {
          setBestStreakMap(prev => ({ ...prev, ...parsed }));
        }
      } catch { /* ignore */ }
    }
    const savedWrong = localStorage.getItem("vocabTestWrong");
    if (savedWrong) {
      try { setWrongWordList(JSON.parse(savedWrong)); } catch { /* ignore */ }
    }
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
            if (data) results[level] = (data as Word[]).map(applyGeneratedWordImage);
          })
        );
        const total = Object.values(results).reduce((s, arr) => s + arr.length, 0);
        const wordData = total === 0 ? groupByLevel(MOCK_WORDS) : results;
        setWordsByLevel(wordData);

        // 排出対象外の品詞（ガチャで取得不可・自動取得）
        const GACHA_EXCLUDED_POS = ["noun", "preposition", "conjunction", "article", "pronoun"];
        const allWords = Object.values(wordData).flat();
        const excludedWords = allWords
          .filter(w => {
            const pos = primaryPartOfSpeech(w.part_of_speech);
            return isTestableWordItem(w) && !!pos && GACHA_EXCLUDED_POS.includes(pos);
          })
          .map(w => w.word);
        // デバッグクリア時の復元用に保存
        localStorage.setItem("autoAcquiredWords", JSON.stringify(excludedWords));
        setAcquiredWords(prev => {
          const next = new Set(prev);
          excludedWords.forEach(w => next.add(w));
          localStorage.setItem("acquiredWords", JSON.stringify([...next]));
          return next;
        });
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

  // ── テスト操作 ───────────────────────────────────────────────
  const getAcqForLevel = useCallback((level: Level) =>
    (wordsByLevel[level] ?? []).filter(w => isTestableWordItem(w) && acquiredWords.has(w.word)),
  [wordsByLevel, acquiredWords]);

  const openTest = useCallback(() => {
    const acq = getAcqForLevel(selectedLevel);
    if (acq.length === 0) return;
    const w = acq[Math.floor(Math.random() * acq.length)];
    setTestWord(w);
    setTestBuilt([]);
    setTestCorrect(false);
    setTestLetters(buildTestLetters(w));
    setLives(3);
    setTestGameOver(false);
    setTestShowAnswer(false);
    setStreak(0);
    setTestPool(null);
    setLastMilestone(0);
    setFullClearDone(false);
    setTestMode(true);
  }, [selectedLevel, getAcqForLevel]);

  const openReview = useCallback(() => {
    const saved = JSON.parse(localStorage.getItem("vocabTestWrong") ?? "[]") as string[];
    if (saved.length === 0) return;
    const allWords = Object.values(wordsByLevel).flat().filter(isTestableWordItem);
    const pool = saved
      .map(wStr => allWords.find(wd => wd.word === wStr))
      .filter((wd): wd is Word => !!wd)
      .slice(0, 10);
    if (pool.length === 0) return;
    const w = pool[Math.floor(Math.random() * pool.length)];
    setTestWord(w);
    setTestBuilt([]);
    setTestCorrect(false);
    setTestLetters(buildTestLetters(w));
    setLives(3);
    setTestGameOver(false);
    setTestShowAnswer(false);
    setStreak(0);
    setTestPool(pool);
    setLastMilestone(0);
    setFullClearDone(false);
    setTestMode(true);
  }, [wordsByLevel]);

  const handleTestTap = useCallback((id: number) => {
    if (!testWord || testCorrect) return;
    const letter = testLetters.find(l => l.id === id);
    if (!letter || letter.used || letter.shaking) return;

    const expected = testWord.word.toLowerCase()[testBuilt.length];
    if (letter.ch === expected) {
      // 正解
      const newLetters = testLetters.map(l => l.id === id ? { ...l, used: true } : l);
      setTestLetters(newLetters);
      const newBuilt = [...testBuilt, letter.ch];
      setTestBuilt(newBuilt);
      if (newBuilt.length === testWord.word.length) {
        // 単語完成！まず発音を再生
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(testWord.word);
          utt.lang = "en-US"; utt.rate = 0.85;
          window.speechSynthesis.speak(utt);
        }
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreakMap(prev => {
          const next = Math.max(prev[selectedLevel] ?? 0, newStreak);
          const updated = { ...prev, [selectedLevel]: next };
          localStorage.setItem("vocabBestStreak", JSON.stringify(updated));
          return updated;
        });
        // ── チケット付与チェック ──────────────────────────────────
        const currentPoolForTicket = testPool ?? getAcqForLevel(selectedLevel);
        const poolSize = currentPoolForTicket.length;
        const kidMode = selectedLevel === "baby" || selectedLevel === "elementary";
        if (!fullClearDone && poolSize > 0 && newStreak >= poolSize) {
          // 全クリア → +5枚
          const cur = Number(localStorage.getItem("tickets") ?? 0);
          localStorage.setItem("tickets", String(cur + 5));
          setFullClearDone(true);
          setTicketReward({ count: 5, reason: kidMode ? "ぜんぶ せいかい！" : "全単語クリア達成！" });
          setTimeout(() => setTicketReward(null), 3500);
        } else if (newStreak % 50 === 0 && newStreak > lastMilestone) {
          // 50問マイルストーン → +1枚
          const cur = Number(localStorage.getItem("tickets") ?? 0);
          localStorage.setItem("tickets", String(cur + 1));
          setLastMilestone(newStreak);
          setTicketReward({ count: 1, reason: kidMode ? `${newStreak}もん たっせい！` : `${newStreak}問達成！` });
          setTimeout(() => setTicketReward(null), 3500);
        }
        setTestCorrect(true);
        setTimeout(() => {
          const currentPool = testPool ?? getAcqForLevel(selectedLevel);
          const candidates = currentPool.filter(w => w.id !== testWord.id);
          const nextPool = candidates.length > 0 ? candidates : currentPool;
          const next = nextPool[Math.floor(Math.random() * nextPool.length)];
          setTestWord(next);
          setTestBuilt([]);
          setTestCorrect(false);
          setTestLetters(buildTestLetters(next));
        }, 1400);
      }
    } else {
      // 不正解 → ライフ減少 + shake
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        // 間違えた単語を localStorage に保存（最大10件）
        setWrongWordList(prev => {
          const updated = [testWord.word, ...prev.filter(w => w !== testWord.word)].slice(0, 10);
          localStorage.setItem("vocabTestWrong", JSON.stringify(updated));
          return updated;
        });
        setTestShowAnswer(true);
        return;
      }
      setTestLetters(prev => prev.map(l => l.id === id ? { ...l, shaking: true } : l));
      setTimeout(() => {
        setTestLetters(prev => prev.map(l => l.id === id ? { ...l, shaking: false } : l));
      }, 550);
    }
  }, [testWord, testBuilt, testLetters, testCorrect, streak, lives, selectedLevel, getAcqForLevel, testPool, fullClearDone, lastMilestone]);

  const speakTestWord = useCallback(() => {
    if (!testWord || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(testWord.word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }, [testWord]);

  // ── ヘルパー ─────────────────────────────────────────────────
  const bestStreak = bestStreakMap[selectedLevel] ?? 0;
  const t: Theme = THEMES.find((th) => th.id === themeId) ?? THEMES[0];
  const currentLevel = LEVELS.find((l) => l.id === selectedLevel) ?? LEVELS[0];
  const totalCount = Object.values(wordsByLevel).reduce((s, arr) => s + arr.length, 0);
  const isBaby = selectedLevel === "baby";
  const isKid = selectedLevel === "baby" || selectedLevel === "elementary";

  const rawWords = wordsByLevel[selectedLevel] ?? [];
  const currentWords =
    sortOrder === "recommended"
      ? sortWordsForDisplay(rawWords, selectedLevel)
      : [...rawWords].sort((a, b) =>
          sortOrder === "az"
            ? a.word.localeCompare(b.word)
            : a.meaning.localeCompare(b.meaning, "ja")
        );
  const currentTarget = VOCABULARY_LEVEL_TARGETS[selectedLevel];
  const currentWordCount = currentWords.filter((w) => !isPhraseItem(w)).length;
  const currentPhraseCount = currentWords.filter((w) => isPhraseItem(w)).length;
  const currentTestableCount = currentWords.filter((w) => isTestableWordItem(w)).length;
  const currentRemaining = getRemainingVocabularyCount(selectedLevel, currentWords.length);

  // アルファベット別グループ（A-Z順 or かな順）
  const wordGroups: { key: string; words: Word[] }[] = [];
  if (sortOrder === "az") {
    const map: Record<string, Word[]> = {};
    currentWords.forEach(w => {
      const k = w.word[0].toUpperCase();
      if (!map[k]) map[k] = [];
      map[k].push(w);
    });
    Object.keys(map).sort().forEach(k => wordGroups.push({ key: k, words: map[k] }));
  } else {
    wordGroups.push({ key: "", words: currentWords });
  }
  const jumpLetters = sortOrder === "az" ? wordGroups.map(g => g.key) : [];

  const scrollToLetter = (letter: string) => {
    letterRefs.current[letter]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ヘッダー高さを動的計測（端末・フォントサイズ差異に対応）
  useEffect(() => {
    if (!headerRef.current) return;
    const obs = new ResizeObserver(() => {
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
    });
    obs.observe(headerRef.current);
    setHeaderH(headerRef.current.offsetHeight);
    return () => obs.disconnect();
  }, []);

  // テストで使う取得済み件数（現在レベル）
  const acqCount  = currentWords.filter(w => acquiredWords.has(w.word)).length;
  const testAvail = getAcqForLevel(selectedLevel).length > 0;

  return (
    <div className={`min-h-screen ${t.bg}`}>

      {/* ── テストオーバーレイ ──────────────────────────────────── */}
      {testMode && testWord && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
          <div className={`flex-1 flex flex-col max-w-md mx-auto w-full ${t.bg} overflow-y-auto`}>

            {/* テストヘッダー */}
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${t.navBorder} sticky top-0 z-10 ${t.nav}`}>
              <button
                onClick={() => { setTestMode(false); setStreak(0); }}
                className={`text-2xl font-bold leading-none px-1 active:scale-90 transition-all ${t.bodyText}`}
                aria-label="テストを閉じる"
              >
                ×
              </button>
              <p className={`font-black text-base flex-1 text-center ${t.titleText}`}>
                🎯 {isKid ? "たんごテスト" : "単語テスト"}
              </p>
              <div className="flex flex-col items-end gap-0.5">
                <div className={`flex items-center gap-1 rounded-lg px-2 py-0.5 ${t.innerCard}`}>
                  <span className="text-base">🔥</span>
                  <span className={`font-black text-lg ${t.titleText}`}>{streak}</span>
                  <span className={`text-[10px] font-bold ${t.subText}`}>{isKid ? "れんぞく" : "連続正解"}</span>
                </div>
                <div className="flex items-center gap-0.5 px-2">
                  <span className="text-[10px]">👑</span>
                  <span className={`text-[11px] font-bold ${t.subText}`}>{isKid ? "さいこう" : "最高"} {bestStreak}{isKid ? "もん" : "問"}</span>
                </div>
              </div>
            </div>

            {/* ライフ（ハート）バー */}
            {!testGameOver && !testShowAnswer && (
              <div className={`mx-4 mt-4 rounded-2xl border ${t.card} ${t.border} px-4 py-2.5 flex items-center gap-3`}>
                <p className={`text-xs font-bold flex-1 leading-snug ${t.bodyText}`}>
                  {isKid
                    ? "まちがえると ハートが ひとつ へるよ！"
                    : "間違えるとハートが1つ減ります"}
                </p>
                <div className="flex gap-1.5 flex-shrink-0">
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ fontSize: "1.6rem", lineHeight: 1 }}>
                      {i < lives ? "🩷" : "🖤"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ヒントカード（日本語 + 発音） */}
            {!testGameOver && !testShowAnswer && (
              <div className="px-4 pt-3 pb-2">
                <div className={`rounded-2xl border-2 p-5 text-center space-y-3 transition-all duration-300 ${
                  testCorrect
                    ? "border-green-400 bg-green-50"
                    : `${t.card} ${t.border}`
                }`}>
                  <div className="text-6xl" style={{ lineHeight: 1 }}>
                    {EMOJI_MAP[testWord.word.toLowerCase()] ?? "📝"}
                  </div>
                  <p className={`text-2xl font-black ${t.titleText}`}>{testWord.meaning}</p>
                  <button
                    onClick={speakTestWord}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm
                      ${t.innerCard} ${t.bodyText} active:scale-95 transition-all`}
                  >
                    🔊 {isKid ? "はつおんを きく" : "発音を聞く"}
                  </button>
                  {testCorrect && (
                    <p className="text-green-600 font-black text-xl animate-bounce">
                      ✅ {isKid ? "せいかい！" : "正解！"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 入力済み文字バー・グリッド（ゲームオーバー・こたえ表示時は非表示） */}
            {!testGameOver && !testShowAnswer && (
              <>
                <div className="px-4 py-2">
                  <div className={`rounded-xl border ${t.card} ${t.border} p-3 flex gap-2 flex-wrap min-h-[3.2rem] items-center`}>
                    {testBuilt.map((ch, i) => (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl shadow ${t.bar} text-white`}
                      >
                        {ch.toUpperCase()}
                      </div>
                    ))}
                    {testBuilt.length < testWord.word.length && !testCorrect && (
                      <div className={`w-10 h-10 rounded-lg border-2 border-dashed ${t.border} flex items-center justify-center`}>
                        <span className={`text-xl ${t.subText}`}>?</span>
                      </div>
                    )}
                    {testBuilt.length === 0 && (
                      <span className={`text-xs ${t.subText} ml-1`}>
                        {isKid ? "もじを タップしてね！" : "文字をタップして並べよう"}
                      </span>
                    )}
                  </div>
                </div>

                {/* 文字グリッド（単語の全文字 + ダミー3つ） */}
                <div className="px-4 pb-6 flex-1">
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}
                  >
                    {testLetters.map((letter) => (
                      <button
                        key={letter.id}
                        onClick={() => handleTestTap(letter.id)}
                        disabled={letter.used || testCorrect}
                        className={`
                          aspect-square rounded-2xl font-black text-3xl
                          flex items-center justify-center
                          transition-all select-none
                          ${letter.used || testCorrect
                            ? "opacity-20 bg-gray-200 text-gray-400 cursor-not-allowed"
                            : `${t.card} border-2 ${t.border} ${t.titleText} shadow-md
                               hover:scale-105 active:scale-90`}
                        `}
                        style={{
                          boxShadow: letter.used || testCorrect ? undefined : "0 3px 0 rgba(0,0,0,0.12)",
                          animation: letter.shaking ? "dummy-wrong 0.55s ease" : undefined,
                        }}
                      >
                        {letter.ch.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* こたえ表示画面（ゲームオーバー前） */}
            {testShowAnswer && !testGameOver && (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">
                <div className="text-6xl" style={{ lineHeight: 1 }}>😢</div>
                <p className={`text-xl font-black ${t.titleText}`}>
                  {isKid ? "ざんねん！こたえは…" : "残念！正解は…"}
                </p>

                {/* こたえカード */}
                <div className={`w-full rounded-2xl border-2 border-red-300 bg-red-50 px-6 py-5 text-center space-y-3`}>
                  <div className="text-5xl" style={{ lineHeight: 1 }}>
                    {EMOJI_MAP[testWord.word.toLowerCase()] ?? "📝"}
                  </div>
                  <p className="text-gray-500 text-base font-bold">{testWord.meaning}</p>
                  {/* 単語を1文字ずつ大きく表示 */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {testWord.word.toUpperCase().split("").map((ch, i) => (
                      <div
                        key={i}
                        className="w-11 h-11 rounded-xl bg-red-400 text-white font-black text-2xl flex items-center justify-center shadow-md"
                      >
                        {ch}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined" && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                        const utt = new SpeechSynthesisUtterance(testWord.word);
                        utt.lang = "en-US"; utt.rate = 0.85;
                        window.speechSynthesis.speak(utt);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 active:scale-95 transition-all"
                  >
                    🔊 {isKid ? "はつおんを きく" : "発音を聞く"}
                  </button>
                </div>

                <button
                  onClick={() => setTestGameOver(true)}
                  className="w-full py-4 rounded-2xl font-black text-xl bg-red-400 text-white active:scale-95 transition-all"
                >
                  {isKid ? "わかった！" : "了解"}
                </button>
              </div>
            )}

            {/* ゲームオーバー画面 */}
            {testGameOver && (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">
                <div className="text-7xl" style={{ lineHeight: 1 }}>💔</div>
                <p className={`text-2xl font-black ${t.titleText}`}>
                  {isKid ? "ゲームオーバー！" : "ゲームオーバー"}
                </p>
                <div className={`rounded-2xl border ${t.card} ${t.border} px-10 py-5 text-center space-y-1`}>
                  <p className={`text-sm ${t.subText}`}>
                    {isKid ? "れんぞく せいかい" : "連続正解"}
                  </p>
                  <p className={`text-5xl font-black ${t.titleText}`}>
                    {streak}
                    <span className={`text-lg font-bold ${t.subText} ml-1`}>{isKid ? "もん" : "問"}</span>
                  </p>
                  <p className={`text-xs ${t.subText}`}>
                    {isKid ? `👑 さいこうは ${bestStreak}もん` : `👑 最高記録: ${bestStreak}問`}
                  </p>
                </div>
                <div className={`w-full rounded-xl ${t.innerCard} px-4 py-3 text-xs ${t.subText} space-y-1.5 text-center`}>
                  <p>🎫 {isKid ? "50もんごとに チケット+1まい もらえるよ！" : "50問ごとにチケット+1枚獲得"}</p>
                  <p>🎊 {isKid ? "ぜんぶ せいかいで チケット+5まい！" : "全単語クリアでチケット+5枚獲得"}</p>
                </div>
                <button
                  onClick={openTest}
                  className={`w-full py-4 rounded-2xl font-black text-xl ${t.bar} text-white active:scale-95 transition-all`}
                >
                  🔄 {isKid ? "もういちど" : "もう一度"}
                </button>
                <button
                  onClick={() => setTestMode(false)}
                  className={`w-full py-3 rounded-2xl font-bold border ${t.card} ${t.border} ${t.bodyText} active:scale-95 transition-all`}
                >
                  {isKid ? "おわる" : "終了する"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── チケット付与演出オーバーレイ ─────────────────────────── */}
      {ticketReward && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 animate-bounce">
            <div className="text-[6rem] leading-none animate-pulse drop-shadow-lg">🎫</div>
            <div className="bg-yellow-400 text-yellow-900 font-black text-center px-8 py-5 rounded-3xl shadow-2xl border-4 border-yellow-300">
              <p className="text-5xl font-black mb-1">+{ticketReward.count}</p>
              <p className="text-base">{ticketReward.reason}</p>
              <p className="text-sm mt-1 opacity-80">チケット獲得！</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ヘッダー ───────────────────────────────────────────── */}
      <header ref={headerRef} className={`${t.nav} border-b ${t.navBorder} sticky top-0 z-10`}>

        {/* タイトル行（1行目） */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 max-w-lg mx-auto">
          <button
            onClick={() => router.push("/")}
            className={`${t.bodyText} text-3xl font-bold leading-none px-1 active:scale-90 transition-all flex-shrink-0`}
            aria-label="戻る"
          >
            ←
          </button>
          <h1 className={`font-bold ${t.titleText} text-lg flex-1 min-w-0 truncate`}>
            {isKid ? "たんごちょう" : "単語帳"}
          </h1>
          <span className={`text-xs ${t.subText} flex-shrink-0`}>全 {totalCount} 語</span>
        </div>

        {/* ストリーク行（2行目） */}
        <div className="flex items-center gap-2 px-4 pb-2 max-w-lg mx-auto">
          <div className={`flex items-center gap-3 rounded-lg px-3 py-1 flex-1 min-w-0 ${t.innerCard}`}>
            <div className="flex items-center gap-1 text-xs font-bold flex-shrink-0">
              <span>🔥</span>
              <span className={`font-black ${t.titleText}`}>{streak}</span>
              <span className={`${t.subText} text-[10px]`}>{isKid ? "れんぞく" : "連続正解"}</span>
              <span className={`${t.subText} mx-0.5`}>/</span>
              <span className={t.bodyText}>{acqCount}</span>
              <span className={`${t.subText} text-[10px]`}>{isKid ? "ごとりちゅう" : "語取得中"}</span>
            </div>
            <div className="flex items-center gap-0.5 text-xs">
              <span>👑</span>
              <span className={`font-bold ${t.subText}`}>{isKid ? "さいこう" : "最高"}</span>
              <span className={`font-black ${t.titleText} ml-0.5`}>{bestStreak}</span>
              <span className={`${t.subText} text-[10px]`}>{isKid ? "もん" : "問"}</span>
            </div>
          </div>
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
          /* 2カラム：左A-Zジャンプ ＋ 右（ソートバー＋取得済み＋単語リスト） */
          <div className="flex gap-1 items-start">
            {/* 左：アルファベットジャンプバー（sticky・ソートバーと同じ高さからスタート） */}
            {jumpLetters.length > 0 && (
              <div
                className="sticky flex flex-col flex-shrink-0 py-0.5"
                style={{ top: `${headerH}px`, height: `calc(100dvh - ${headerH}px)` }}
              >
                {jumpLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => scrollToLetter(letter)}
                    style={{ fontSize: `clamp(8px, ${Math.floor(100 / jumpLetters.length)}vh, 13px)` }}
                    className={`flex-1 min-h-0 w-6 rounded font-black ${t.bar} text-white active:scale-90 transition-all shadow-sm flex items-center justify-center border border-black/40`}
                  >
                    {letter}
                  </button>
                ))}
                {/* 下限調整用の透明スペーサー×2 */}
                <div className="flex-1 min-h-0 w-6 opacity-0 pointer-events-none" />
                <div className="flex-1 min-h-0 w-6 opacity-0 pointer-events-none" />
              </div>
            )}

            {/* 右：ソートバー＋取得済みバナー＋単語リスト */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* ソートバー */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${t.bar}`}>
                  {currentLevel.label}
                </span>
                <span className={`text-xs ${t.subText}`}>{currentWords.length}語</span>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => setSortOrder("recommended")}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      sortOrder === "recommended"
                        ? `${t.bar} text-white`
                        : `${t.card} ${t.bodyText} border ${t.border}`
                    }`}
                  >
                    おすすめ順
                  </button>
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

              {/* 取得済み件数バナー */}
              {(() => {
                const acquired = currentWords.filter(w => acquiredWords.has(w.word)).length;
                const total = currentWords.length;
                return (
                  <div className={`mb-3 rounded-xl px-3 py-2 flex items-center gap-2 ${t.innerCard}`}>
                    <span className="text-lg">🔓</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={t.bodyText + " font-bold"}>取得済み</span>
                        <span className={t.subText}>{acquired} / {total}</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${t.divider} overflow-hidden`}>
                        <div className={`h-full ${t.bar} rounded-full transition-all`} style={{ width: `${total > 0 ? (acquired / total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 単語リスト */}
              <div className={`mb-3 rounded-xl px-3 py-3 ${t.innerCard}`}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={t.bodyText + " font-bold"}>おすすめライン</span>
                  <span className={t.subText}>あと {currentRemaining.minimum} 件で実用ライン</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className={`rounded-lg px-2 py-2 ${t.card} border ${t.border}`}>
                    <p className={`text-[10px] ${t.subText}`}>実用ラインまで</p>
                    <p className={`text-sm font-black ${t.titleText}`}>{currentRemaining.minimum}</p>
                  </div>
                  <div className={`rounded-lg px-2 py-2 ${t.card} border ${t.border}`}>
                    <p className={`text-[10px] ${t.subText}`}>余裕ラインまで</p>
                    <p className={`text-sm font-black ${t.titleText}`}>{currentRemaining.comfortable}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {wordGroups.map(({ key, words }) => (
                  <div key={key} ref={key ? (el) => { letterRefs.current[key] = el; } : undefined}>
                    {key && (
                      <p
                        className={`text-xs font-black ${t.subText} pt-3 pb-1 sticky ${t.bg} z-[5]`}
                        style={{ top: `${headerH}px` }}
                      >
                        — {key} —
                      </p>
                    )}
                    {words.map((w) => (
                      <div key={w.id} className="mb-1.5">
                        <VocabularyWordCard
                          word={w}
                          level={selectedLevel}
                          emojiBg={t.innerCard}
                          focusLabel={getVocabularyFocusLabel(w, selectedLevel)}
                          t={t}
                          acquired={acquiredWords.has(w.word)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* フッター分の余白 */}
        <div className={`mt-4 mb-3 rounded-xl px-3 py-3 ${t.innerCard}`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`${t.bodyText} font-bold`}>おすすめ学習ボリューム</span>
            <span className={t.subText}>
              単語 {currentWordCount}/{currentTarget.words} ・ 熟語 {currentPhraseCount}/{currentTarget.phrases}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`rounded-lg px-2 py-2 ${t.card} border ${t.border}`}>
              <p className={`text-[10px] ${t.subText}`}>単語</p>
              <p className={`text-sm font-black ${t.titleText}`}>{currentWordCount}</p>
            </div>
            <div className={`rounded-lg px-2 py-2 ${t.card} border ${t.border}`}>
              <p className={`text-[10px] ${t.subText}`}>熟語</p>
              <p className={`text-sm font-black ${t.titleText}`}>{currentPhraseCount}</p>
            </div>
            <div className={`rounded-lg px-2 py-2 ${t.card} border ${t.border}`}>
              <p className={`text-[10px] ${t.subText}`}>テスト対象</p>
              <p className={`text-sm font-black ${t.titleText}`}>{currentTestableCount}</p>
            </div>
          </div>
        </div>
        <div style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }} />
      </main>

      {/* フッター：テスト・ふくしゅうボタン */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t flex gap-2 px-4 pt-2 ${t.nav} ${t.navBorder}`}
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={openTest}
          disabled={!testAvail}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm ${t.bar} text-white active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow`}
        >
          🎯 {isKid ? "テスト" : "テスト"}
        </button>
        <button
          onClick={openReview}
          disabled={wrongWordList.length === 0}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm border-2 ${t.border} ${t.bodyText} ${t.card} active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          📖 {isKid ? "ふくしゅう" : "復習"}
          {wrongWordList.length > 0 && (
            <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${t.bar} text-white`}>
              {Math.min(wrongWordList.length, 10)}
            </span>
          )}
        </button>
      </div>
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
  focusLabel,
  t,
  acquired,
}: {
  word: Word;
  level: Level;
  levelColor: string;
  emojiBg: string;
  focusLabel: string;
  t: Theme;
  acquired: boolean;
}) {
  const isPhrase = isPhraseItem(word);
  const emoji = !isPhrase ? (EMOJI_MAP[word.word.toLowerCase()] ?? null) : null;
  const pos = primaryPartOfSpeech(word.part_of_speech);

  const speakWord = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word.word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }, [word.word]);
  const posLabel = pos
    ? level === "baby"
      ? (POS_BABY[pos] ?? null)
      : (POS_JA[pos] ?? null)
    : null;
  const posColor = pos ? (POS_COLOR[pos] ?? "bg-gray-100 text-gray-600") : null;

  return (
    <div className={`relative rounded-xl border ${t.border} shadow-sm flex items-stretch overflow-hidden transition-opacity ${acquired ? t.card : "bg-gray-100"} ${acquired ? "" : "opacity-50"}`}>

      {/* 左：絵文字 or ロック */}
      <div className={`flex-shrink-0 flex items-center justify-center ${acquired ? emojiBg : "bg-gray-200"}`} style={{ width: "3.5rem" }}>
        {acquired
          ? <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{emoji ?? "📝"}</span>
          : <span style={{ fontSize: "1.6rem" }}>🔒</span>
        }
      </div>

      {/* 中央：日本語 + 品詞 + 英語 */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 px-3 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {acquired ? (
            <>
              <p className={`${t.subText} text-sm leading-none truncate`}>{word.meaning}</p>
              <span className="flex-shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700">
                {focusLabel}
              </span>
              {posLabel && (
                <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 font-bold leading-none ${posColor} ${level === "baby" ? "text-[9px]" : "text-[10px]"}`}>
                  {posLabel.replace("\n", "")}
                </span>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm leading-none">???</p>
          )}
        </div>
        {acquired ? (
          <p className={`font-bold ${t.bodyText} ${isPhrase ? "text-lg" : "text-xl"} leading-tight`}>{word.word}</p>
        ) : (
          <p className="font-bold text-gray-400 text-xl leading-tight tracking-widest">
            {"*".repeat(Math.min(word.word.replace(/\s+/g, "").length, 8))}
          </p>
        )}
      </div>

      {/* 右：音声ボタン */}
      {acquired && (
        <button
          onClick={(e) => { e.stopPropagation(); speakWord(); }}
          className="bg-white flex items-center justify-center flex-shrink-0 opacity-40 hover:opacity-100 active:scale-90 transition-all px-3"
          style={{ fontSize: "1.5rem" }}
          aria-label={`${word.word}の発音`}
        >
          🔊
        </button>
      )}
    </div>
  );
}
