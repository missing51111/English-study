"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES, type Theme } from "@/lib/themes";
type LevelUI = typeof LEVEL_UI.baby;

// ============================================================
// 難易度定義
// ============================================================
const LEVELS = [
  { id: "baby",       label: "ベビー",  emoji: "🐣", sub: "2〜5さい", free: true,  color: "from-pink-400 to-rose-300" },
  { id: "elementary", label: "小学生",  emoji: "🐥", sub: "小学生",   free: true,  color: "from-yellow-400 to-amber-300" },
  { id: "junior",     label: "中学生",  emoji: "📘", sub: "Junior",  free: false, color: "from-blue-500 to-indigo-400" },
  { id: "high",       label: "高校生",  emoji: "🎯", sub: "High",    free: false, color: "from-violet-500 to-purple-400" },
  { id: "toeic",      label: "TOEIC",  emoji: "🔒", sub: "ビジネス", free: false, color: "from-gray-500 to-gray-400" },
];

// 難易度ごとのUI設定
const LEVEL_UI = {
  baby: {
    bannerBg: "bg-gradient-to-r from-pink-400 to-rose-400",
    bannerText: "きょうも いっしょに\nえいごを おぼえよう！",
    mascot: "🐣",
    missionLabel: "みっしょん",
    mission1: "もんだいをとく",
    mission2: "ふくしゅうする",
    ticketLabel: "まい",
    allClear: "ぜんぶできたらチケット1まい！",
    startLabel: "📝　もんだいを とこう！",
    reviewLabel: "🔁　ふくしゅうする",
    startRound: "rounded-3xl", startSize: "py-5 text-xl",
    reviewRound: "rounded-3xl", reviewSize: "py-4 text-lg",
    parentLabel: "れんらくちょう",
    stat1Label: "せいかいりつ", stat2Label: "こんしゅうのことば", stat3Label: "のこりのたんご",
  },
  elementary: {
    // 小1〜3で習う漢字のみ：日、学、校、今、週、正、答、単、語、残、問、題、復、習
    bannerBg: "bg-gradient-to-r from-yellow-400 to-amber-400",
    bannerText: "今日も いっしょに\nえいごを 学ぼう！",
    mascot: "🐥",
    missionLabel: "ミッション",
    mission1: "問題を とく",
    mission2: "ふくしゅうする",
    ticketLabel: "まい",
    allClear: "全部できたらチケット1まい！",
    startLabel: "📝　問題を とこう！",
    reviewLabel: "🔁　ふくしゅうする",
    startRound: "rounded-2xl", startSize: "py-5 text-xl",
    reviewRound: "rounded-2xl", reviewSize: "py-4 text-lg",
    parentLabel: "れんらくちょう",
    stat1Label: "正かいりつ", stat2Label: "今週の 単語", stat3Label: "のこりの 単語",
  },
  junior: {
    // 小学校全漢字＋中学漢字：正答率、復習、残、獲得 など
    bannerBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
    bannerText: "今日も一緒に\n英語を勉強しよう！",
    mascot: "📘",
    missionLabel: "ミッション",
    mission1: "問題を解く",
    mission2: "復習する",
    ticketLabel: "枚",
    allClear: "全クリアでチケット1枚獲得！",
    startLabel: "📝　問題を解く",
    reviewLabel: "🔁　復習する",
    startRound: "rounded-2xl", startSize: "py-4 text-lg",
    reviewRound: "rounded-2xl", reviewSize: "py-3 text-base",
    parentLabel: "保護者向け",
    stat1Label: "今日の正答率", stat2Label: "今週の単語数", stat3Label: "残りの単語",
  },
  high: {
    // 常用漢字全般：習得、達成、継続 など
    bannerBg: "bg-gradient-to-r from-violet-500 to-purple-500",
    bannerText: "継続は力なり。\n今日も英語を習得しよう！",
    mascot: "🎯",
    missionLabel: "ミッション",
    mission1: "問題を解く",
    mission2: "復習する",
    ticketLabel: "枚",
    allClear: "全達成でチケット1枚獲得！",
    startLabel: "📝　問題を解く",
    reviewLabel: "🔁　復習する",
    startRound: "rounded-xl", startSize: "py-4 text-base",
    reviewRound: "rounded-xl", reviewSize: "py-3 text-base",
    parentLabel: "保護者向け",
    stat1Label: "本日の正答率", stat2Label: "今週の習得単語", stat3Label: "残余単語数",
  },
};

const MOCK_PARENT = {
  accuracyToday: 80, accuracyWeek: [60, 75, 70, 85, 80, 90, 80],
  wordsThisWeek: 12, wordsGoal: 20,
  childComment: "きょうも80てんとれたね！すごい！このちょうしでいこう🔥",
  parentComment: "今週は動詞の正答率が先週より15%アップしました。毎日コツコツ続けている成果が出ています📈",
};

// ============================================================
// 共通部品
// ============================================================
const MissionRow = ({ icon, label, current, target, t }: { icon: string; label: string; current: number; target: number; t: Theme }) => (
  <div className="flex items-center gap-2">
    <span className="text-base">{icon}</span>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <p className={`text-xs truncate font-medium ${t.bodyText}`}>{label}</p>
        <p className={`text-xs ml-1 whitespace-nowrap ${t.subText}`}>{current}/{target}</p>
      </div>
      <div className={`w-full rounded-full h-1.5 ${t.innerCard}`}>
        <div className={`h-1.5 rounded-full ${t.bar}`} style={{ width: `${Math.min((current / target) * 100, 100)}%` }} />
      </div>
    </div>
  </div>
);

const MiniGraph = ({ values, t }: { values: number[]; t: Theme }) => {
  const max = Math.max(...values, 1);
  const days = ["月","火","水","木","金","土","日"];
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v: number, i: number) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className={`w-full rounded-sm ${v >= 80 ? "bg-green-400" : v >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
            style={{ height: `${(v / max) * 32}px` }} />
          <span className={`text-xs ${t.subText}`}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// ParentPanel
// ============================================================
function ParentPanel({ lu, t, levelId }: { lu: LevelUI; t: Theme; levelId: string }) {
  const [open, setOpen] = useState(false);
  const d = MOCK_PARENT;
  const isBaby = levelId === "baby";
  const isKid = levelId === "baby" || levelId === "elementary";
  return (
    <div className={`rounded-2xl overflow-hidden border ${isKid ? "bg-pink-100 border-pink-300" : `${t.card} ${t.border}`}`}>
      <button onClick={() => setOpen(v => !v)} className="w-full text-left">
        {!open ? (
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>👨‍👩‍👧</span>
                <span className={`text-sm font-bold ${isKid ? "text-pink-700" : t.bodyText}`}>{lu.parentLabel}</span>
              </div>
              <span className={`text-xs ${isKid ? "text-pink-500" : t.subText}`}>▼ くわしく見る</span>
            </div>
            <div className="flex gap-2">
              {[
                { label: lu.stat1Label, value: `${d.accuracyToday}%`, color: "text-green-500" },
                { label: lu.stat2Label, value: `${d.wordsThisWeek}語`, color: t.accent },
                { label: lu.stat3Label, value: `${120 - d.wordsThisWeek}語`, color: t.accent },
              ].map(item => (
                <div key={item.label} className={`flex-1 rounded-xl px-2 py-2 text-center ${t.innerCard}`}>
                  <p className={`text-xs mb-0.5 ${t.subText}`}>{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <p className={`text-xs rounded-xl px-3 py-2 leading-relaxed ${t.innerCard} ${t.bodyText}`}>
              📊 {d.parentComment}
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span>👨‍👩‍👧</span>
              <span className={`text-sm font-bold ${isKid ? "text-pink-700" : t.bodyText}`}>{lu.parentLabel}</span>
            </div>
            <span className={`text-xs ${t.subText}`}>▲ とじる</span>
          </div>
        )}
      </button>
      {open && (
        <div className={`px-4 pb-4 space-y-4 pt-3 border-t ${t.divider}`}>
          <div className={`rounded-xl px-3 py-2.5 flex gap-2 items-start ${t.innerCard}`}>
            <span className="text-xl">{lu.mascot}</span>
            <div>
              <p className={`text-xs font-bold mb-0.5 ${t.accent}`}>きょうのひとこと</p>
              <p className={`text-sm leading-relaxed ${t.bodyText}`}>{d.childComment}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-wider ${t.bodyText}`}>正答率</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={t.subText}>今日</span>
                <span className={`font-bold ${t.bodyText}`}>{d.accuracyToday}%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${t.innerCard}`}>
                <div className="bg-green-400 h-2 rounded-full" style={{ width: `${d.accuracyToday}%` }} />
              </div>
            </div>
            <p className={`text-xs ${t.subText}`}>直近7日間</p>
            <MiniGraph values={d.accuracyWeek} t={t} />
          </div>
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-wider ${t.bodyText}`}>今週おぼえた単語</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${t.accent}`}>{d.wordsThisWeek}</span>
              <span className={`text-sm mb-1 ${t.subText}`}>/ 目標 {d.wordsGoal} 語</span>
            </div>
            <div className={`w-full rounded-full h-2 ${t.innerCard}`}>
              <div className={`h-2 rounded-full ${t.bar}`} style={{ width: `${Math.min((d.wordsThisWeek / d.wordsGoal) * 100, 100)}%` }} />
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${t.innerCard}`}>
            <span className="text-xl">📚</span>
            <span className={`text-sm ${t.bodyText}`}>のこりの単語は<span className="font-bold"> {120 - d.wordsThisWeek}語</span>です！</span>
          </div>
          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 font-bold text-sm">
            📈 もっとくわしい記録を見る（PRO）
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ThemePicker / LockedModal
// ============================================================
const ThemePicker = ({ current, onChange }: { current: string; onChange: (id: string) => void }) => (
  <div className="flex gap-2 justify-center">
    {THEMES.map(th => (
      <button key={th.id} onClick={() => onChange(th.id)}
        className={`w-7 h-7 rounded-full border-2 transition-all ${th.preview} ${current === th.id ? "border-gray-800 scale-110 shadow-lg" : "border-white opacity-60"}`} />
    ))}
  </div>
);

const LockedModal = ({ level, onClose }: { level: { label: string }; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" onClick={onClose}>
    <div className="bg-gray-800 rounded-3xl p-6 w-full max-w-xs text-center space-y-4" onClick={e => e.stopPropagation()}>
      <div className="text-5xl">🔒</div>
      <h2 className="text-xl font-bold text-white">{level.label}</h2>
      <p className="text-gray-400 text-sm">このレベルはプレミアムプランで解放できます。</p>
      <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 font-bold text-lg">解放する（準備中）</button>
      <button onClick={onClose} className="text-gray-500 text-sm underline">とじる</button>
    </div>
  </div>
);

// ============================================================
// Main
// ============================================================
export default function HomePage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState("baby");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lockedTarget, setLockedTarget] = useState<{ id: string; label: string } | null>(null);
  const [themeId, setThemeId] = useState("dark");
  const [themeOpen, setThemeOpen] = useState(false);

  // テーマをlocalStorageに保存（他ページで共有）
  useEffect(() => {
    localStorage.setItem("theme", themeId);
  }, [themeId]);

  const tickets = 2;
  const currentLevel = LEVELS.find(l => l.id === selectedLevel) ?? LEVELS[0];
  const lu = (LEVEL_UI as Record<string, typeof LEVEL_UI.baby>)[selectedLevel] ?? LEVEL_UI.high;
  const t = THEMES.find(th => th.id === themeId) ?? THEMES[0];
  const isFree = currentLevel.free;
  const isBaby = selectedLevel === "baby";
  const isKid = selectedLevel === "baby" || selectedLevel === "elementary";

  const handleLevelSelect = (lv: typeof LEVELS[number]) => {
    if (!lv.free) setLockedTarget(lv);
    else setSelectedLevel(lv.id);
    setDropdownOpen(false);
  };

  return (
    <div className={`min-h-screen ${t.bg} flex flex-col max-w-md mx-auto p-4 gap-4 transition-colors duration-300`}>

      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <h1 className={`text-base font-bold whitespace-nowrap ${t.titleText}`}>
          {isBaby ? "えいごのおもちゃばこ" : "英語ボックス"}
        </h1>
        <span className={`text-xs font-bold whitespace-nowrap ${t.subText}`}>
          {isFree ? "むずかしさ" : "難易度"}
        </span>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${currentLevel.color} text-white shadow relative`}
        >
          <span>{currentLevel.free ? currentLevel.emoji : "🔒"}</span>
          <span className="whitespace-nowrap">{currentLevel.label}</span>
          <span className="text-white/70">{dropdownOpen ? "▲" : "▼"}</span>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden min-w-max"
              onClick={e => e.stopPropagation()}>
              {LEVELS.map(lv => (
                <button key={lv.id} onClick={() => handleLevelSelect(lv)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-700 transition-all ${selectedLevel === lv.id ? "bg-gray-700" : ""}`}>
                  <span className="text-lg">{lv.free ? lv.emoji : "🔒"}</span>
                  <span className={`font-bold ${lv.free ? "text-white" : "text-gray-400"}`}>{lv.label}</span>
                  <span className="text-gray-500 text-xs ml-auto pl-4">{lv.sub}</span>
                  {!lv.free && <span className="text-yellow-400 text-xs font-bold ml-1">PRO</span>}
                  {selectedLevel === lv.id && <span className="text-indigo-400 ml-1">✓</span>}
                </button>
              ))}
            </div>
          )}
        </button>
        <div className="relative">
          <button onClick={() => setThemeOpen(v => !v)}
            className={`w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0 ${THEMES.find(th => th.id === themeId)?.preview}`} />
          {themeOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3 min-w-max">
              <p className="text-xs text-gray-500 mb-2 font-bold text-center">テーマ</p>
              <ThemePicker current={themeId} onChange={(id: string) => { setThemeId(id); setThemeOpen(false); }} />
            </div>
          )}
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${t.avatarBg} ${t.avatarText}`}>U</div>
      </div>

      {/* バナー（全難易度） */}
      <div className={`${t.bannerBg} ${isBaby ? "rounded-3xl" : "rounded-2xl"} p-4 flex items-center gap-3 shadow-lg`}>
        <span className={isBaby ? "text-5xl" : "text-4xl"}>{lu.mascot}</span>
        <div className="flex-1">
          <p className={`text-white font-black leading-tight ${isBaby ? "text-lg" : "text-base"}`}
            style={{textShadow: "0 1px 3px rgba(0,0,0,0.4)"}}>
            {lu.bannerText.split("\n").map((line: string, i: number) => <span key={i}>{line}{i === 0 && <br/>}</span>)}
          </p>
        </div>
      </div>

      {/* ミッション＋チケット */}
      <div className="flex gap-2 items-stretch">
        <div className={`rounded-2xl p-3 border flex flex-col gap-2 flex-1 min-w-0 ${t.card} ${t.border}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${t.subText}`}>{lu.missionLabel}</p>
          <MissionRow icon="📝" label={lu.mission1} current={3} target={5} t={t} />
          <MissionRow icon="🔁" label={lu.mission2} current={1} target={3} t={t} />
          <div className={`border-t pt-1.5 flex items-center justify-center gap-1 ${t.divider}`}>
            <span className="text-xs">🎟️</span>
            <p className={`text-xs font-bold ${t.allClearText}`}>{lu.allClear}</p>
          </div>
        </div>
        <div className={`rounded-2xl border flex flex-col items-center justify-center w-[33%] flex-shrink-0 ${t.card} ${t.border}`} style={{padding: "6px"}}>
          <svg viewBox="0 0 200 120" style={{width: "100%", height: "60px", display: "block"}} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="tg2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185"/>
                <stop offset="100%" stopColor="#f59e0b"/>
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="192" height="112" rx="12" fill="url(#tg2)"/>
<circle cx="150" cy="4" r="10" fill="white"/>
            <circle cx="150" cy="116" r="10" fill="white"/>
            <line x1="150" y1="14" x2="150" y2="106" stroke="white" strokeWidth="2" strokeDasharray="6,4" opacity="0.6"/>
            <text x="100" y="68" textAnchor="middle" fontSize="28" fontWeight="bold" fill="white">
              {isBaby ? "ちけっと" : selectedLevel === "elementary" ? "ちけっと" : "TICKET"}
            </text>
            {(selectedLevel === "elementary") && (
              <text x="100" y="95" textAnchor="middle" fontSize="22" fontWeight="bold" fill="white" letterSpacing="6" opacity="0.5">TICKET</text>
            )}
          </svg>
          <div className="flex items-baseline gap-0.5 mt-1">
            <p className={`font-black ${t.ticketNum}`} style={{fontSize: "2rem", lineHeight: 1}}>{tickets}</p>
            <p className={`font-bold ${t.subText}`} style={{fontSize: "0.85rem"}}>{lu.ticketLabel}</p>
          </div>
        </div>
      </div>

      {/* 保護者パネル（無料のみ） */}
      {isFree && <ParentPanel lu={lu} t={t} levelId={selectedLevel} />}

      {/* スタートボタン */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push(`/quiz?level=${selectedLevel}`)}
          className={`w-full ${t.startBtn} ${t.startText} font-bold shadow-lg active:scale-95 transition-all ${lu.startRound} ${lu.startSize}`}>
          {lu.startLabel}
        </button>
        <button className={`w-full border font-bold active:scale-95 transition-all ${lu.reviewRound} ${lu.reviewSize} ${t.reviewBtn} ${t.reviewText} ${t.border}`}>
          {lu.reviewLabel}
        </button>
      </div>

      <div className="h-16" />

      {/* ボトムナビ */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t flex justify-around py-3 px-4 ${t.nav} ${t.navBorder}`}>
        {[
          { icon: "🏠", label: isKid ? "ホーム" : "ホーム",     path: "/",           active: true },
          { icon: "📚", label: isKid ? "たんご" : "単語",       path: "/vocabulary", active: false },
          { icon: "🎰", label: isKid ? "がちゃ" : "ガチャ",     path: null,          active: false },
          { icon: "👤", label: isKid ? "じぶん" : "マイページ", path: null,          active: false },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => item.path && router.push(item.path)}
            className={`flex flex-col items-center gap-1 ${item.active ? t.navActive : t.navInactive} ${!item.path ? "opacity-40" : ""}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {lockedTarget && <LockedModal level={lockedTarget} onClose={() => setLockedTarget(null)} />}
    </div>
  );
}
