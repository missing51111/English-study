"use client";
import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes";

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
    { icon: "🏆", label: isKid ? "じつりょくをためそう" : "チャレンジ", done: true },
    { icon: "🎯", label: isKid ? "みっしょん" : "ミッション",        done: true  },
    { icon: "🔊", label: isKid ? "おとがでる" : "音声読み上げ",      done: true  },
    { icon: "📱", label: "PWA",                                    done: true  },
    { icon: "✉️", label: isKid ? "れんらくちょう" : "連絡帳(AI)",    done: false },
    { icon: "🔡", label: isKid ? "たんごをつくる" : "単語つくり",    done: false },
    { icon: "🎰", label: isKid ? "がちゃ" : "ガチャ",               done: false },
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

      <div className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-4">

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
            label={isKid ? "もんだいをとく" : "問題を解く"}
            current={Math.min(missionQuiz, 5)}
            target={5}
            done={m1ok}
            t={t}
          />
          <div className="mt-2">
            <MissionBar
              icon="🏆"
              label={isKid ? "じつりょくをためそう" : "実力を試そう"}
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
