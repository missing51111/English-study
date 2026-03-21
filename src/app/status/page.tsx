export default function StatusPage() {
  const skills = [
    { cat: "フレームワーク", items: ["Next.js 15 (App Router)", "React 19", "TypeScript"] },
    { cat: "スタイリング",   items: ["Tailwind CSS", "CSS-in-JS (inline style)", "レスポンシブデザイン"] },
    { cat: "バックエンド",   items: ["Supabase (PostgreSQL)", "Row Level Security", "SQL upsert / ON CONFLICT"] },
    { cat: "状態管理",       items: ["localStorage 永続化", "useLayoutEffect (フラッシュ防止)", "日次リセットパターン"] },
    { cat: "API / Web標準", items: ["Web Speech API (TTS)", "Drag & Drop API", "PWA / Service Worker"] },
    { cat: "インフラ",       items: ["Vercel (自動デプロイ)", "GitHub (CI/CD)", "@ducanh2912/next-pwa"] },
    { cat: "データ処理",     items: ["CSV → SQL 変換 (Node.js)", "Promise.all 並列クエリ", "多レベル単語データ設計"] },
  ];

  const implemented = [
    {
      icon: "🎨", title: "5テーマカラーシステム",
      desc: "ピンク・ミント・クリーム・茶色・ダークの5テーマ。全ページで共有し、useLayoutEffectでフラッシュなし読み込み。",
      tags: ["Tailwind CSS", "localStorage", "useLayoutEffect"],
    },
    {
      icon: "📚", title: "単語帳ページ",
      desc: "Supabase から全レベルの単語を並列取得（1000行上限対策）。品詞バッジ・絵文字・音声読み上げボタンを表示。",
      tags: ["Supabase", "Promise.all", "Web Speech API"],
    },
    {
      icon: "🧩", title: "並び替えクイズ",
      desc: "英文をシャッフルして出題。タップ＆ドラッグ両対応。選択済み単語は透過表示のまま残す UX。正解時に音声自動再生。",
      tags: ["Drag & Drop", "useCallback", "Supabase"],
    },
    {
      icon: "🏆", title: "チャレンジクイズ（実力を試そう！）",
      desc: "別の文からディストラクター単語（特に前置詞）を混入した上級者向け並び替え問題。1日3問クリアで達成。",
      tags: ["distractor words", "ゲームデザイン"],
    },
    {
      icon: "🎯", title: "ミッション＆チケットシステム",
      desc: "日次ミッション（問題5問・チャレンジ3問）を両方達成するとチケット＋1枚。0時自動リセット。二重付与バグも修正済み。",
      tags: ["localStorage", "日次リセット", "ゲームループ"],
    },
    {
      icon: "🔊", title: "音声読み上げ（TTS）",
      desc: "外部APIなしでブラウザ内蔵のWeb Speech APIを活用。単語・文章ともに英語ネイティブ発音（rate 0.85）で再生。",
      tags: ["Web Speech API", "SpeechSynthesisUtterance"],
    },
    {
      icon: "🗂️", title: "難易度別UI自動切替",
      desc: "ベビー（ひらがな）→ 小学生（小1〜3漢字）→ 中学生 → 高校生 まで、学年別漢字配当表に沿ってテキストを自動切替。",
      tags: ["UXデザイン", "国語教育設計"],
    },
    {
      icon: "📊", title: "Supabaseデータ管理",
      desc: "baby 172語、elementary 406語、junior 505語。問題文はbaby 920問、elementary 1,110問。CSVから Node.js でSQL変換して投入。",
      tags: ["PostgreSQL", "Node.js", "CSV処理"],
    },
    {
      icon: "📱", title: "PWA対応",
      desc: "スマートフォンのホーム画面に追加可能。Vercelへの push で自動デプロイ。",
      tags: ["PWA", "Vercel", "next-pwa"],
    },
  ];

  const planned = [
    {
      icon: "📋", title: "単語帳レイアウト変更（2列→1列）",
      desc: "詳細情報を広く表示できる縦スクロール型リストに変更。",
      prio: 4,
    },
    {
      icon: "🔤", title: "アルファベットジャンプボタン",
      desc: "単語帳上部にA〜Zボタンを設置し、先頭へ即スクロール。",
      prio: 3,
    },
    {
      icon: "👶", title: "ベビー向けヒント枠",
      desc: "解答欄に単語サイズのガイド枠を表示して難易度を調整。",
      prio: 3,
    },
    {
      icon: "✉️", title: "れんらくちょう（Claude API連携）",
      desc: "成績データをもとにClaude APIが保護者向けポジティブコメントを自動生成。課金機能の目玉として設計。",
      prio: 4, api: true,
    },
    {
      icon: "🔡", title: "単語つくり機能（チケット消費型）",
      desc: "未取得単語から1文字ずつ選んで単語を完成させるインタラクティブ学習。チケット1枚消費でプレイ。",
      prio: 5,
    },
  ];

  const db = [
    { num: "172",   label: "ベビー単語",    color: "#f43f5e" },
    { num: "406",   label: "小学生単語",    color: "#f59e0b" },
    { num: "505",   label: "中学生単語",    color: "#14b8a6" },
    { num: "920",   label: "ベビー問題文",  color: "#6366f1" },
    { num: "1,110", label: "小学生問題文",  color: "#92400e" },
  ];

  return (
    <div style={{ fontFamily: "'Hiragino Sans','Meiryo',sans-serif", background: "#0d1117", color: "#e6edf3", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#161b22 0%,#1f2937 100%)", borderBottom: "1px solid #30363d", padding: "56px 24px 40px", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>📦</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: ".04em", margin: 0 }}>英語ボックス</h1>
        <p style={{ marginTop: 8, color: "#8b949e", fontSize: ".95rem" }}>子ども向け英語学習ゲームアプリ — 2歳〜高校生対応</p>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
          {[
            { label: "Next.js 15", color: "#58a6ff" },
            { label: "TypeScript", color: "#3178c6" },
            { label: "Supabase",   color: "#3ecf8e" },
            { label: "Tailwind",   color: "#06b6d4" },
            { label: "Vercel",     color: "#e6edf3" },
            { label: "PWA",        color: "#f59e0b" },
          ].map(b => (
            <span key={b.label} style={{
              border: `1px solid ${b.color}55`, borderRadius: 99,
              padding: "3px 12px", fontSize: ".75rem", fontWeight: 700, color: b.color,
            }}>{b.label}</span>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <a href="/" style={{ display: "inline-block", background: "#238636", color: "#fff", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: ".85rem", textDecoration: "none" }}>
            🏠 アプリを開く
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px 80px" }}>

        {/* DB Stats */}
        <Sec title="📊 データ規模">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {db.map(s => (
              <div key={s.label} style={{ flex: "1 1 130px", background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: s.color }}>{s.num}</div>
                <div style={{ fontSize: ".72rem", color: "#8b949e", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Sec>

        {/* Implemented */}
        <Sec title="✅ 実装済み機能">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
            {implemented.map(f => (
              <div key={f.title} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontWeight: 800, fontSize: ".9rem", marginBottom: 6, color: "#e6edf3" }}>{f.icon} {f.title}</div>
                <div style={{ fontSize: ".78rem", color: "#8b949e", lineHeight: 1.65 }}>{f.desc}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {f.tags.map(tg => (
                    <span key={tg} style={{ background: "#21262d", border: "1px solid #30363d", borderRadius: 99, padding: "2px 9px", fontSize: ".68rem", color: "#58a6ff", fontWeight: 700 }}>{tg}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Sec>

        {/* Skills */}
        <Sec title="🛠️ 習得スキル・使用技術">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
            {skills.map(sk => (
              <div key={sk.cat} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: ".75rem", fontWeight: 800, color: "#f0883e", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>{sk.cat}</div>
                {sk.items.map(it => (
                  <div key={it} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: "#3ecf8e", fontSize: ".75rem" }}>▸</span>
                    <span style={{ fontSize: ".8rem", color: "#c9d1d9" }}>{it}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Sec>

        {/* Roadmap */}
        <Sec title="🚀 実装予定ロードマップ">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {planned.map(f => (
              <div key={f.title} style={{ display: "flex", gap: 16, background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: "1.6rem", flexShrink: 0 }}>{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: ".9rem", color: "#e6edf3", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {f.title}
                    {f.api && <span style={{ background: "#1f2d3d", border: "1px solid #388bfd55", borderRadius: 99, padding: "1px 9px", fontSize: ".68rem", color: "#58a6ff", fontWeight: 700 }}>Claude API</span>}
                  </div>
                  <div style={{ fontSize: ".78rem", color: "#8b949e", marginTop: 4, lineHeight: 1.6 }}>{f.desc}</div>
                  {/* 優先度ドット */}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: 99, background: i < f.prio ? "#f0883e" : "#30363d" }} />
                    ))}
                    <span style={{ fontSize: ".68rem", color: "#8b949e", marginLeft: 4, alignSelf: "center" }}>優先度</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Sec>

        {/* Architecture */}
        <Sec title="🏗️ アーキテクチャ">
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "20px", fontFamily: "monospace", fontSize: ".8rem", color: "#8b949e", lineHeight: 1.8, overflowX: "auto" }}>
            <pre style={{ margin: 0 }}>{`src/
  app/
    page.tsx          # ホーム (/)
    quiz/page.tsx     # 並び替えクイズ (/quiz)
    challenge/page.tsx # 実力チャレンジ (/challenge)
    vocabulary/page.tsx # 単語帳 (/vocabulary)
    mypage/page.tsx   # マイページ (/mypage)
    status/page.tsx   # このページ (/status)
  components/
    HomePage.tsx      # ホーム UI・テーマ・ミッション
    QuizPage.tsx      # クイズ UI・ドラッグ&タップ
    ChallengePage.tsx # チャレンジ UI
    VocabularyPage.tsx # 単語帳 UI
    MyPage.tsx        # マイページ UI
  lib/
    themes.ts         # 5テーマ定義
    supabase.ts       # Supabaseクライアント
  types/
    database.ts       # DB型定義
supabase/
  schema.sql          # テーブル定義
  seed_lv1_questions.sql # ベビー問題 920問
  seed_lv2_questions.sql # 小学生問題 1,110問`}</pre>
          </div>
        </Sec>

        {/* Design Philosophy */}
        <Sec title="💡 設計思想">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
            {[
              { icon: "🔁", title: "学習ループ",    desc: "学習 → 復習 → 報酬（チケット）のゲームループで継続を促す" },
              { icon: "🎮", title: "スタミナ制なし", desc: "クイズ回数に制限を設けず、ミッションで自然な目標を提供" },
              { icon: "📖", title: "漢字配当準拠",   desc: "難易度ごとに学年別漢字配当表に沿ったUIテキストを使用" },
              { icon: "💳", title: "課金設計",       desc: "無料（baby/elementary）＋PRO（junior以上・AI連絡帳）の2層構造" },
            ].map(c => (
              <div key={c.title} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontWeight: 800, color: "#e6edf3", marginBottom: 4 }}>{c.icon} {c.title}</div>
                <div style={{ fontSize: ".78rem", color: "#8b949e", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </Sec>

        <div style={{ textAlign: "center", color: "#484f58", fontSize: ".75rem", marginTop: 40, paddingTop: 24, borderTop: "1px solid #21262d" }}>
          英語ボックス — 最終更新 2026年3月 ／ <a href="https://github.com/missing51111/English-study" style={{ color: "#58a6ff", textDecoration: "none" }}>GitHub</a>
        </div>

      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#e6edf3", whiteSpace: "nowrap" }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: "#30363d" }} />
      </div>
      {children}
    </div>
  );
}
