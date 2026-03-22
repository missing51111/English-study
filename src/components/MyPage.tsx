"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes";
import { supabase } from "@/lib/supabase";

// 難易度ラベル
const LEVEL_LABEL: Record<string, { name: string; emoji: string; kid: boolean }> = {
  baby:       { name: "ベビー",  emoji: "🐣", kid: true  },
  elementary: { name: "小学生",  emoji: "🐥", kid: true  },
  junior:     { name: "中学生",  emoji: "📘", kid: false },
  high:       { name: "高校生",  emoji: "🎯", kid: false },
  toeic:      { name: "TOEIC",  emoji: "🔒", kid: false },
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MyPage() {
  const router = useRouter();

  const [themeId, setThemeId]         = useState("pink");
  const [level, setLevel]             = useState("baby");
  const [tickets, setTickets]         = useState(0);
  const [score, setScore]             = useState({ correct: 0, total: 0 });
  const [missionQuiz, setMissionQuiz] = useState(0);
  const [missionReview, setMissionReview] = useState(0);
  const [ticketAwarded, setTicketAwarded] = useState(false);
  const [tab, setTab]                 = useState<"record" | "about">("record");

  useLayoutEffect(() => {
    const th = localStorage.getItem("theme");
    if (th && THEMES.find(x => x.id === th)) setThemeId(th);
    const lv = localStorage.getItem("level");
    if (lv) setLevel(lv);
    const t = localStorage.getItem("tickets");
    if (t) setTickets(Number(t));

    const today = getTodayStr();
    const s = localStorage.getItem("dailyScore");
    if (s) {
      const p = JSON.parse(s);
      if (p.date === today) setScore({ correct: p.correct ?? 0, total: p.total ?? 0 });
    }
    const m = localStorage.getItem("dailyMissions");
    if (m) {
      const p = JSON.parse(m);
      if (p.date === today) {
        setMissionQuiz(p.quizCount ?? 0);
        setMissionReview(p.reviewCount ?? 0);
        setTicketAwarded(p.ticketAwarded ?? false);
      }
    }
  }, []);

  const t   = THEMES.find(th => th.id === themeId) ?? THEMES[0];
  const lv  = LEVEL_LABEL[level] ?? LEVEL_LABEL.baby;
  const isKid = lv.kid;

  const pct  = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const m1ok = missionQuiz >= 5;
  const m2ok = missionReview >= 3;

  // ── 機能リスト（増えるたびここに追記） ──────────────────────────
  const features = [
    { icon: "🎨", label: isKid ? "テーマ" : "テーマ切替",          done: true  },
    { icon: "📚", label: isKid ? "たんごちょう" : "単語帳",         done: true  },
    { icon: "🧩", label: isKid ? "もんだい" : "クイズ",             done: true  },
    { icon: "🏆", label: isKid ? "いっぱいふえてるよ" : "チャレンジ", done: true },
    { icon: "🎯", label: isKid ? "みっしょん" : "ミッション",        done: true  },
    { icon: "🔊", label: isKid ? "おとがでる" : "音声読み上げ",      done: true  },
    { icon: "📱", label: "PWA",                                    done: true  },
    { icon: "👶", label: isKid ? "ベビーヒントわく" : "ベビーヒント枠", done: true },
    { icon: "✉️", label: isKid ? "れんらくちょう" : "連絡帳(AI)",    done: false },
    { icon: "🔡", label: isKid ? "たんごをつくる" : "単語つくり",    done: true  },
  ];

  return (
    <div className={`min-h-screen ${t.bg} pb-24`}>

      {/* ヘッダー */}
      <div className={`${t.bannerBg ?? "bg-gradient-to-r from-rose-400 to-pink-400"} p-5 text-white`}>
        <button
          onClick={() => router.push("/")}
          className="mb-3 flex items-center gap-1 text-white/80 text-sm font-bold"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {isKid ? "もどる" : "戻る"}
        </button>
        <div className="flex items-center gap-4">
          {/* アバター */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg ${t.avatarBg}`}>
            {lv.emoji}
          </div>
          <div>
            <p className="font-black text-xl leading-tight">{isKid ? "じぶんの ページ" : "マイページ"}</p>
            <p className="text-white/80 text-sm mt-0.5">{lv.name} {isKid ? "コース" : "コース"}</p>
          </div>
        </div>
      </div>

      {/* タブ切替 */}
      <div className={`sticky top-0 z-10 max-w-md mx-auto w-full flex border-b ${t.nav} ${t.navBorder}`}>
        {([
          { key: "record", label: isKid ? "📅 きろく" : "📅 記録" },
          { key: "about",  label: "🛠️ このアプリ" },
        ] as const).map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 py-3 text-sm font-bold transition-all
              ${tab === tb.key
                ? `border-b-2 ${t.navActive} border-current`
                : `${t.navInactive}`}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-4">

      {tab === "record" && <>
        {/* ── 今日のきろく ── */}
        <Section title={isKid ? "📅 きょうのきろく" : "📅 今日の記録"} t={t}>
          <div className="grid grid-cols-3 gap-3">
            <StatBox
              num={`${score.total}`}
              label={isKid ? "といた もんだい" : "解いた問題"}
              color={t.navActive}
            />
            <StatBox
              num={`${score.correct}`}
              label={isKid ? "せいかい" : "正解"}
              color={t.navActive}
            />
            <StatBox
              num={score.total > 0 ? `${pct}%` : "—"}
              label={isKid ? "せいかいりつ" : "正解率"}
              color={t.navActive}
            />
          </div>
        </Section>

        {/* ── ミッション ── */}
        <Section title={isKid ? "🎯 みっしょん" : "🎯 ミッション"} t={t}>
          <MissionBar
            icon="📝"
            label={isKid ? "ならびかえてね" : "問題を解く"}
            current={Math.min(missionQuiz, 5)}
            target={5}
            done={m1ok}
            t={t}
          />
          <div className="mt-2">
            <MissionBar
              icon="🏆"
              label={isKid ? "いっぱいふえてるよ！" : "実力を試そう"}
              current={Math.min(missionReview, 3)}
              target={3}
              done={m2ok}
              t={t}
            />
          </div>
          {ticketAwarded && (
            <p className={`mt-3 text-center text-sm font-bold ${t.allClearText}`}>
              🎫 {isKid ? "きょうのチケットをもらったよ！" : "今日のチケットをもらったよ！"}
            </p>
          )}
        </Section>

        {/* ── チケット ── */}
        <Section title={isKid ? "🎫 チケット" : "🎫 チケット"} t={t}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎫</span>
            <div>
              <p className={`font-black ${t.ticketNum}`} style={{ fontSize: "2.2rem", lineHeight: 1 }}>{tickets}</p>
              <p className={`text-xs font-bold ${t.subText}`}>{isKid ? "まい もってるよ" : "枚 所持"}</p>
            </div>
          </div>
        </Section>

        {/* ── つかえる きのう ── */}
        <Section title={isKid ? "✨ つかえる きのう" : "✨ 利用できる機能"} t={t}>
          <div className="grid grid-cols-2 gap-2">
            {features.map(f => (
              <div
                key={f.label}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-sm font-bold
                  ${f.done ? `${t.innerCard} ${t.border} ${t.bodyText}` : "bg-gray-100 border-gray-200 text-gray-400"}`}
              >
                <span className={f.done ? "" : "grayscale opacity-50"}>{f.icon}</span>
                <span className="truncate">{f.label}</span>
                {f.done
                  ? <span className="ml-auto text-green-500 text-xs">✔</span>
                  : <span className="ml-auto text-gray-300 text-xs">🔒</span>
                }
              </div>
            ))}
          </div>
          <p className={`mt-2 text-xs ${t.subText} text-center`}>
            {isKid ? "🔒 は これから つくるよ！" : "🔒 は今後追加予定です"}
          </p>
        </Section>

        {/* ── テーマ ── */}
        <Section title={isKid ? "🎨 いまのテーマ" : "🎨 現在のテーマ"} t={t}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${t.bar} shadow`} />
            <div>
              <p className={`font-bold ${t.bodyText}`}>{t.label}</p>
              <p className={`text-xs ${t.subText}`}>{isKid ? "ホームから かえられるよ" : "ホームから変更できます"}</p>
            </div>
          </div>
        </Section>

      </>}

      {tab === "about" && <>
        <AboutSection />
        {/* ── DEBUGパネル（このアプリタブ最下部） ── */}
        <DebugPanel />
      </>}

      </div>

      {/* ボトムナビ */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t flex justify-around py-3 px-4 ${t.nav} ${t.navBorder}`}>
        {[
          { icon: "🏠", label: isKid ? "ホーム" : "ホーム",     path: "/"          },
          { icon: "📚", label: isKid ? "たんご" : "単語",       path: "/vocabulary" },
          { icon: "🎰", label: isKid ? "がちゃ" : "ガチャ",     path: null         },
          { icon: "👤", label: isKid ? "じぶん" : "マイページ", path: "/mypage", active: true },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => item.path && router.push(item.path)}
            className={`flex flex-col items-center gap-1
              ${(item as { active?: boolean }).active ? t.navActive : t.navInactive}
              ${!item.path ? "opacity-40" : ""}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ────────────────────────────
type T = typeof THEMES[0];
function Section({ title, t, children }: { title: string; t: T; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-4 border ${t.card} ${t.border}`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <p className={`text-sm font-black mb-3 ${t.titleText}`}>{title}</p>
      {children}
    </div>
  );
}

function StatBox({ num, label, color }: { num: string; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
      <p className={`font-black text-xl ${color}`}>{num}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// このアプリについて（開発者情報）
// ────────────────────────────────────────────────────────────
function AboutSection() {
  const implemented = [
    { icon: "🎨", title: "5テーマカラー",            tags: ["Tailwind", "localStorage"] },
    { icon: "📚", title: "単語帳（1列＋ジャンプ）",   tags: ["Supabase", "useRef", "scrollIntoView"] },
    { icon: "🧩", title: "並び替えクイズ",            tags: ["Drag&Drop", "useCallback"] },
    { icon: "🏆", title: "チャレンジクイズ",          tags: ["distractor words"] },
    { icon: "🎯", title: "ミッション＆チケット",       tags: ["localStorage", "0時リセット"] },
    { icon: "🔊", title: "音声読み上げ",              tags: ["Web Speech API"] },
    { icon: "📱", title: "PWA対応",                  tags: ["Vercel", "next-pwa"] },
    { icon: "👤", title: "マイページ",                tags: ["Next.js App Router"] },
    { icon: "📋", title: "単語帳 1列レイアウト",      tags: ["UX改善"] },
    { icon: "🔤", title: "アルファベットジャンプ",     tags: ["scrollIntoView", "useRef"] },
    { icon: "👶", title: "ベビー向けヒント枠",         tags: ["字数ガイド", "UX改善"] },
    { icon: "✉️", title: "れんらくちょう（Claude API）", tags: ["Anthropic API", "AI生成", "保護者向け"] },
    { icon: "🎊", title: "単語取得お祝い演出",           tags: ["confetti", "CSS animation"] },
    { icon: "🔡", title: "単語つくり機能（チケット消費）", tags: ["letter game", "localStorage", "Supabase"] },
  ];

  const planned: { icon: string; title: string; prio: number; desc: string; api?: boolean }[] = [
    {
      icon: "🖼️",
      title: "問題出題文章への挿絵表示",
      prio: 4,
      desc: "並び替え問題・チャレンジ問題の出題時に、文章の内容に合った挿絵（イラスト画像）を表示する。視覚的なヒントで意味理解を促進し、特に低年齢層の学習効果を高める。",
    },
  ];

  const skills = [
    { cat: "フロント",  items: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"] },
    { cat: "バックエンド", items: ["Supabase / PostgreSQL", "SQL upsert", "Row Level Security"] },
    { cat: "状態管理",  items: ["localStorage 永続化", "useLayoutEffect", "日次リセット"] },
    { cat: "Web標準",   items: ["Web Speech API", "Drag & Drop API", "PWA"] },
    { cat: "インフラ",  items: ["Vercel", "GitHub CI/CD"] },
    { cat: "データ処理", items: ["CSV→SQL変換 (Node.js)", "並列クエリ (Promise.all)"] },
  ];

  const db = [
    { num: "172",   label: "ベビー単語",    color: "#f43f5e" },
    { num: "406",   label: "小学生単語",    color: "#f59e0b" },
    { num: "505",   label: "中学生単語",    color: "#14b8a6" },
    { num: "920",   label: "ベビー問題文",  color: "#6366f1" },
    { num: "1,110", label: "小学生問題文",  color: "#92400e" },
  ];

  const dark = { bg: "#f8fafc", border: "#e2e8f0", text: "#0f172a", sub: "#475569", card: "#ffffff" };

  return (
    <div style={{ fontFamily: "inherit" }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#1e293b,#334155)", border: `1px solid ${dark.border}`, borderRadius: 16, padding: "24px 20px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem" }}>📦</div>
        <p style={{ fontWeight: 900, fontSize: "1.2rem", color: dark.text, margin: "6px 0 4px" }}>英語ボックス</p>
        <p style={{ fontSize: ".78rem", color: dark.sub }}>子ども向け英語学習ゲームアプリ — 2歳〜高校生</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
          {["Next.js 15","TypeScript","Supabase","Tailwind","Vercel","PWA"].map(b => (
            <span key={b} style={{ border: "1px solid #58a6ff55", borderRadius: 99, padding: "2px 10px", fontSize: ".68rem", fontWeight: 700, color: "#58a6ff" }}>{b}</span>
          ))}
        </div>
      </div>

      {/* DB Stats */}
      <AboutSec title="📊 データ規模" dark={dark}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {db.map(s => (
            <div key={s.label} style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: s.color }}>{s.num}</div>
              <div style={{ fontSize: ".62rem", color: dark.sub, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </AboutSec>

      {/* 実装済み */}
      <AboutSec title="✅ 実装済み機能" dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {implemented.map(f => (
            <div key={f.title} style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.2rem" }}>{f.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: ".82rem", color: dark.text }}>{f.title}</span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  {f.tags.map(tg => (
                    <span key={tg} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 99, padding: "1px 8px", fontSize: ".62rem", color: "#1d4ed8", fontWeight: 700 }}>{tg}</span>
                  ))}
                </div>
              </div>
              <span style={{ color: "#16a34a", fontWeight: 700, fontSize: ".8rem" }}>✔</span>
            </div>
          ))}
        </div>
      </AboutSec>

      {/* 未実装 */}
      <AboutSec title="🚀 実装予定" dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {planned.map((f, idx) => (
            <div key={f.title} style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
              {/* 番号バッジ */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 99, background: "#f0883e", color: "#fff", fontWeight: 900, fontSize: ".8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: "1.2rem" }}>{f.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: ".82rem", color: dark.text }}>{f.title}</span>
                  {("api" in f) && <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 99, padding: "1px 7px", fontSize: ".62rem", color: "#1d4ed8", fontWeight: 700 }}>Claude API</span>}
                  <span style={{ color: dark.sub, fontSize: ".8rem", marginLeft: "auto" }}>🔒</span>
                </div>
                <p style={{ fontSize: ".75rem", color: dark.sub, lineHeight: 1.65, margin: "0 0 6px" }}>{f.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: 99, background: i < f.prio ? "#f0883e" : dark.border }} />
                  ))}
                  <span style={{ fontSize: ".62rem", color: dark.sub, marginLeft: 2 }}>優先度</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AboutSec>

      {/* スキル */}
      <AboutSec title="🛠️ 習得スキル" dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {skills.map(sk => (
            <div key={sk.cat} style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: ".68rem", fontWeight: 800, color: "#f0883e", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{sk.cat}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {sk.items.map(it => (
                  <span key={it} style={{ background: "#f1f5f9", border: `1px solid ${dark.border}`, borderRadius: 6, padding: "3px 10px", fontSize: ".72rem", color: dark.text, fontWeight: 600 }}>{it}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AboutSec>

      <div style={{ textAlign: "center", fontSize: ".7rem", color: dark.sub, paddingTop: 12, paddingBottom: 8 }}>
        最終更新 2026年3月
      </div>
    </div>
  );
}

function AboutSec({ title, dark, children }: { title: string; dark: { text: string; border: string }; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <p style={{ fontWeight: 800, fontSize: ".82rem", color: dark.text, margin: 0, whiteSpace: "nowrap" }}>{title}</p>
        <div style={{ flex: 1, height: 1, background: dark.border }} />
      </div>
      {children}
    </div>
  );
}

// ============================================================
// DEBUGパネル
// ============================================================
const DBG_LEVELS = ["baby", "elementary", "junior", "high", "toeic"] as const;
const DBG_LEVEL_NAME: Record<string, string> = {
  baby: "ベビー", elementary: "小学生", junior: "中学生", high: "高校生", toeic: "TOEIC",
};

function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg]   = useState("");

  // ── 編集中の値 ────────────────────────────────────────────
  const [dbTickets,  setDbTickets]  = useState(0);
  const [dbQuiz,     setDbQuiz]     = useState(0);
  const [dbReview,   setDbReview]   = useState(0);
  const [dbCorrect,  setDbCorrect]  = useState(0);
  const [dbTotal,    setDbTotal]    = useState(0);
  const [dbAcqCount, setDbAcqCount] = useState(0);
  const [dbAutoAcqCount, setDbAutoAcqCount] = useState(0);
  const [dbBest,     setDbBest]     = useState<Record<string, number>>({});
  const [dbWrong,    setDbWrong]    = useState(0);
  const [dbPro,      setDbPro]      = useState(false);
  const [dbLevelData, setDbLevelData] = useState<Record<string, { total: number; acquired: number; loading: boolean }>>({});

  // パネルを開くたびに最新値を読み込む
  useEffect(() => {
    if (!open) return;
    const today = getTodayStr();
    setDbTickets(Number(localStorage.getItem("tickets") ?? 0));

    const m = localStorage.getItem("dailyMissions");
    if (m) {
      const p = JSON.parse(m);
      if (p.date === today) { setDbQuiz(p.quizCount ?? 0); setDbReview(p.reviewCount ?? 0); }
      else { setDbQuiz(0); setDbReview(0); }
    } else { setDbQuiz(0); setDbReview(0); }

    const s = localStorage.getItem("dailyScore");
    if (s) {
      const p = JSON.parse(s);
      if (p.date === today) { setDbCorrect(p.correct ?? 0); setDbTotal(p.total ?? 0); }
      else { setDbCorrect(0); setDbTotal(0); }
    } else { setDbCorrect(0); setDbTotal(0); }

    const acq = localStorage.getItem("acquiredWords");
    setDbAcqCount(acq ? JSON.parse(acq).length : 0);
    const autoAcq = localStorage.getItem("autoAcquiredWords");
    setDbAutoAcqCount(autoAcq ? JSON.parse(autoAcq).length : 0);

    const best = localStorage.getItem("vocabBestStreak");
    setDbBest(best ? JSON.parse(best) : {});

    const wrong = localStorage.getItem("vocabTestWrong");
    setDbWrong(wrong ? JSON.parse(wrong).length : 0);

    setDbPro(localStorage.getItem("proUnlocked") === "true");

    // レベル別単語カウントを非同期取得
    const acqSet = new Set(JSON.parse(localStorage.getItem("acquiredWords") ?? "[]") as string[]);
    setDbLevelData(Object.fromEntries(DBG_LEVELS.map(lv => [lv, { total: 0, acquired: 0, loading: true }])));
    Promise.all(
      DBG_LEVELS.map(async lv => {
        const { data } = await supabase.from("words").select("word").eq("level", lv);
        return [lv, {
          total: data?.length ?? 0,
          acquired: data?.filter(w => acqSet.has(w.word)).length ?? 0,
          loading: false,
        }] as const;
      })
    ).then(entries => setDbLevelData(Object.fromEntries(entries)));
  }, [open]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  // ── 保存ヘルパー ──────────────────────────────────────────
  const saveTickets = (v: number) => {
    const n = Math.max(0, v);
    localStorage.setItem("tickets", String(n));
    setDbTickets(n);
    flash("🎫 チケット更新");
  };
  const saveMissions = (quiz: number, review: number) => {
    const today = getTodayStr();
    const prev = JSON.parse(localStorage.getItem("dailyMissions") ?? "{}");
    const next = { ...prev, date: today, quizCount: Math.max(0, quiz), reviewCount: Math.max(0, review) };
    localStorage.setItem("dailyMissions", JSON.stringify(next));
    setDbQuiz(next.quizCount); setDbReview(next.reviewCount);
    flash("🎯 ミッション更新");
  };
  const saveScore = (correct: number, total: number) => {
    const s = { date: getTodayStr(), correct: Math.max(0, correct), total: Math.max(0, total) };
    localStorage.setItem("dailyScore", JSON.stringify(s));
    setDbCorrect(s.correct); setDbTotal(s.total);
    flash("📊 スコア更新");
  };
  const acquireAllForLevel = async (lv: string) => {
    setDbLevelData(prev => ({ ...prev, [lv]: { ...prev[lv], loading: true } }));
    const { data } = await supabase.from("words").select("word").eq("level", lv);
    if (!data) { setDbLevelData(prev => ({ ...prev, [lv]: { ...prev[lv], loading: false } })); return; }
    const acqList = JSON.parse(localStorage.getItem("acquiredWords") ?? "[]") as string[];
    const next = [...new Set([...acqList, ...data.map(w => w.word)])];
    localStorage.setItem("acquiredWords", JSON.stringify(next));
    setDbAcqCount(next.length);
    setDbLevelData(prev => ({ ...prev, [lv]: { total: data.length, acquired: data.length, loading: false } }));
    flash(`✅ ${DBG_LEVEL_NAME[lv]} 全取得（${data.length}語）`);
  };

  const resetLevelWords = async (lv: string) => {
    setDbLevelData(prev => ({ ...prev, [lv]: { ...prev[lv], loading: true } }));
    const { data } = await supabase.from("words").select("word").eq("level", lv);
    if (!data) { setDbLevelData(prev => ({ ...prev, [lv]: { ...prev[lv], loading: false } })); return; }
    const levelSet = new Set(data.map(w => w.word));
    const autoAcq = new Set(JSON.parse(localStorage.getItem("autoAcquiredWords") ?? "[]") as string[]);
    const acqList = JSON.parse(localStorage.getItem("acquiredWords") ?? "[]") as string[];
    // このレベルの単語のうち autoAcquiredWords 以外を削除
    const next = acqList.filter(w => !levelSet.has(w) || autoAcq.has(w));
    localStorage.setItem("acquiredWords", JSON.stringify(next));
    setDbAcqCount(next.length);
    const keptInLevel = next.filter(w => levelSet.has(w)).length;
    setDbLevelData(prev => ({ ...prev, [lv]: { total: data.length, acquired: keptInLevel, loading: false } }));
    flash(`🗑 ${DBG_LEVEL_NAME[lv]} リセット（自動取得 ${keptInLevel}語を保持）`);
  };

  const clearAcquired = () => {
    if (!confirm("ガチャで取得した単語をクリアします。\n排出対象外（名詞・前置詞・接続詞など）は保持されます。")) return;
    const autoAcq = JSON.parse(localStorage.getItem("autoAcquiredWords") ?? "[]") as string[];
    localStorage.setItem("acquiredWords", JSON.stringify(autoAcq));
    setDbAcqCount(autoAcq.length);
    flash(`📚 取得単語クリア（自動取得 ${autoAcq.length} 語を保持）`);
  };
  const resetBest = () => {
    localStorage.removeItem("vocabBestStreak");
    setDbBest({}); flash("👑 最高連続数リセット");
  };
  const clearWrong = () => {
    localStorage.removeItem("vocabTestWrong");
    setDbWrong(0); flash("📖 ふくしゅうリストクリア");
  };
  const resetDaily = () => {
    localStorage.removeItem("dailyScore");
    localStorage.removeItem("dailyMissions");
    setDbQuiz(0); setDbReview(0); setDbCorrect(0); setDbTotal(0);
    flash("⚠️ 今日のデータリセット");
  };
  const clearAll = () => {
    if (!confirm("全データをクリアします。\n排出対象外単語（名詞・前置詞・接続詞など）は保持されます。")) return;
    const autoAcq = JSON.parse(localStorage.getItem("autoAcquiredWords") ?? "[]") as string[];
    localStorage.clear();
    if (autoAcq.length > 0) {
      localStorage.setItem("acquiredWords", JSON.stringify(autoAcq));
      localStorage.setItem("autoAcquiredWords", JSON.stringify(autoAcq));
    }
    setDbTickets(0); setDbQuiz(0); setDbReview(0); setDbCorrect(0);
    setDbTotal(0); setDbAcqCount(autoAcq.length); setDbBest({}); setDbWrong(0); setDbPro(false);
    flash(`🗑 全データクリア（自動取得 ${autoAcq.length} 語を保持）`);
  };

  const numCls = "w-14 text-center bg-gray-800 rounded-lg px-2 py-1.5 font-bold text-white border border-gray-600 text-sm";
  const btnSm  = "w-8 h-8 rounded-lg bg-gray-700 text-white font-black text-lg leading-none flex items-center justify-center flex-shrink-0";
  const btnApl = "px-3 py-1.5 rounded-lg bg-blue-800 text-blue-200 font-bold text-xs flex-shrink-0";
  const btnMax = "px-2 py-1.5 rounded-lg bg-green-900 text-green-300 font-bold text-xs flex-shrink-0";
  const btnDng = "px-3 py-1.5 rounded-lg bg-red-950 text-red-400 font-bold text-xs flex-shrink-0";

  return (
    <div className="mt-1 mb-4">
      {/* トグルボタン */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold opacity-0 hover:opacity-100 transition-opacity select-none"
        aria-label="DEBUGパネル"
      >
        <span className="flex items-center gap-2">🛠 DEBUGパネル</span>
        <span>{open ? "▲ 閉じる" : "▼ 開く"}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border-2 border-dashed border-gray-600 bg-gray-900 text-gray-200 p-4 space-y-5 text-sm">

          {/* フラッシュメッセージ */}
          {msg && (
            <div className="bg-green-900 text-green-300 rounded-lg px-3 py-2 text-center font-bold text-xs">
              {msg}
            </div>
          )}

          {/* ── チケット ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">🎫 チケット枚数</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDbTickets(v => Math.max(0, v - 1))} className={btnSm}>−</button>
              <input type="number" value={dbTickets} min={0}
                onChange={e => setDbTickets(Number(e.target.value))}
                className={numCls}
              />
              <button onClick={() => setDbTickets(v => v + 1)} className={btnSm}>＋</button>
              <button onClick={() => saveTickets(dbTickets)} className={btnApl}>適用</button>
              <button onClick={() => saveTickets(0)} className={btnDng}>リセット</button>
            </div>
          </div>

          {/* ── ミッション ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">🎯 今日のミッション</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-16 flex-shrink-0">問題数 /5</span>
                <button onClick={() => saveMissions(dbQuiz - 1, dbReview)} className={btnSm}>−</button>
                <input type="number" value={dbQuiz} min={0}
                  onChange={e => setDbQuiz(Number(e.target.value))}
                  className={numCls}
                />
                <button onClick={() => saveMissions(dbQuiz + 1, dbReview)} className={btnSm}>＋</button>
                <button onClick={() => saveMissions(5, dbReview)} className={btnMax}>MAX</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-16 flex-shrink-0">チャレンジ /3</span>
                <button onClick={() => saveMissions(dbQuiz, dbReview - 1)} className={btnSm}>−</button>
                <input type="number" value={dbReview} min={0}
                  onChange={e => setDbReview(Number(e.target.value))}
                  className={numCls}
                />
                <button onClick={() => saveMissions(dbQuiz, dbReview + 1)} className={btnSm}>＋</button>
                <button onClick={() => saveMissions(dbQuiz, 3)} className={btnMax}>MAX</button>
              </div>
              <button onClick={() => saveMissions(5, 3)} className="w-full py-1.5 rounded-lg bg-green-900 text-green-300 font-bold text-xs">
                ✅ 両方MAX（チケット付与条件）
              </button>
            </div>
          </div>

          {/* ── スコア ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">📊 今日のスコア</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 text-xs">正解</span>
              <input type="number" value={dbCorrect} min={0}
                onChange={e => setDbCorrect(Number(e.target.value))}
                className={numCls}
              />
              <span className="text-gray-500 text-xs">/ 総問題</span>
              <input type="number" value={dbTotal} min={0}
                onChange={e => setDbTotal(Number(e.target.value))}
                className={numCls}
              />
              <button onClick={() => saveScore(dbCorrect, dbTotal)} className={btnApl}>適用</button>
            </div>
          </div>

          {/* ── 取得単語 ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">📚 取得済み単語</p>
            <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
              <div>
                <span className="font-black text-white">{dbAcqCount} <span className="text-gray-400 font-normal text-xs">語</span></span>
                <p className="text-gray-600 text-[10px] mt-0.5">
                  排出対象外（自動）{dbAutoAcqCount}語 ／ ガチャ取得 {Math.max(0, dbAcqCount - dbAutoAcqCount)}語
                </p>
              </div>
              <button onClick={clearAcquired} className={btnDng}>ガチャ分クリア</button>
            </div>
          </div>

          {/* ── 難易度別 全単語取得/リセット ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">🎓 難易度別 全単語取得 / リセット</p>
            <div className="space-y-1.5">
              {DBG_LEVELS.map(lv => {
                const ld = dbLevelData[lv];
                const pct = ld && ld.total > 0 ? Math.round((ld.acquired / ld.total) * 100) : 0;
                return (
                  <div key={lv} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-gray-300 text-xs font-bold">{DBG_LEVEL_NAME[lv]}</span>
                        {ld ? (
                          ld.loading
                            ? <span className="text-gray-600 text-[10px]">読込中…</span>
                            : <span className="text-gray-500 text-[10px]">{ld.acquired}/{ld.total}語 ({pct}%)</span>
                        ) : <span className="text-gray-600 text-[10px]">—</span>}
                      </div>
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <button
                      disabled={ld?.loading}
                      onClick={() => acquireAllForLevel(lv)}
                      className="px-2 py-1 rounded-lg bg-blue-900 text-blue-300 font-bold text-[11px] flex-shrink-0 disabled:opacity-40"
                    >
                      全取得
                    </button>
                    <button
                      disabled={ld?.loading}
                      onClick={() => resetLevelWords(lv)}
                      className="px-2 py-1 rounded-lg bg-red-950 text-red-400 font-bold text-[11px] flex-shrink-0 disabled:opacity-40"
                    >
                      リセット
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 最高連続数 ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">👑 単語テスト最高連続数</p>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {DBG_LEVELS.map(lv => (
                <div key={lv} className="bg-gray-800 rounded-lg px-1 py-2 text-center border border-gray-700">
                  <div className="text-gray-500 text-[9px] mb-0.5">{DBG_LEVEL_NAME[lv]}</div>
                  <div className="font-black text-yellow-400 text-base">{dbBest[lv] ?? 0}</div>
                </div>
              ))}
            </div>
            <button onClick={resetBest} className="w-full py-1.5 rounded-lg bg-red-950 text-red-400 font-bold text-xs">
              全レベルリセット
            </button>
          </div>

          {/* ── ふくしゅうリスト ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">📖 単語ふくしゅうリスト</p>
            <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
              <span className="font-black text-white">{dbWrong} <span className="text-gray-400 font-normal text-xs">件</span></span>
              <button onClick={clearWrong} className={btnDng}>クリア</button>
            </div>
          </div>

          {/* ── PRO解禁 ── */}
          <div>
            <p className="text-gray-400 font-bold text-xs mb-2">🔓 課金コース解禁（中学生・高校生・TOEIC）</p>
            <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
              <div>
                <span className={`font-black text-sm ${dbPro ? "text-green-400" : "text-gray-500"}`}>
                  {dbPro ? "🔓 解禁中（DEV）" : "🔒 ロック中"}
                </span>
                <p className="text-gray-600 text-[10px] mt-0.5">ホームで難易度ドロップダウンを再度開いて反映</p>
              </div>
              <button
                onClick={() => {
                  const next = !dbPro;
                  localStorage.setItem("proUnlocked", next ? "true" : "false");
                  setDbPro(next);
                  flash(next ? "🔓 PRO解禁 ON" : "🔒 PRO解禁 OFF");
                }}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex-shrink-0 transition-colors ${
                  dbPro
                    ? "bg-green-900 text-green-300 border border-green-700"
                    : "bg-gray-700 text-gray-300 border border-gray-600"
                }`}
              >
                {dbPro ? "ON ✓" : "OFF"}
              </button>
            </div>
          </div>

          {/* ── 危険操作 ── */}
          <div className="border-t border-gray-700 pt-3 space-y-2">
            <p className="text-gray-500 text-xs font-bold">⚠️ 危険操作</p>
            <button onClick={resetDaily}
              className="w-full py-2 rounded-xl bg-orange-950 text-orange-400 font-bold text-sm border border-orange-900">
              ⚠️ 今日のデータをリセット
            </button>
            <button onClick={clearAll}
              className="w-full py-2 rounded-xl bg-red-950 text-red-400 font-bold text-sm border border-red-900">
              🗑 全データをクリア（要確認）
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ────────────────────────────
function MissionBar({ icon, label, current, target, done, t }: {
  icon: string; label: string; current: number; target: number; done: boolean;
  t: T;
}) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold ${t.bodyText}`}>{icon} {label}</span>
        <span className={`text-xs font-bold ${done ? "text-green-600" : t.subText}`}>
          {done ? "✔ たっせい" : `${current} / ${target}`}
        </span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden border ${t.staminaBorder} bg-gray-100`}>
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-green-400" : t.staminaFill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
