export default function StatusPage() {
  return (
    <div style={{ fontFamily: "'Hiragino Sans', Meiryo, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ヘッダー */}
      <div style={{ background: "linear-gradient(135deg,#f43f5e 0%,#fb923c 40%,#facc15 100%)", color: "#fff", padding: "36px 24px 28px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: ".04em", textShadow: "0 2px 8px rgba(0,0,0,.2)" }}>📦 英語ボックス</h1>
        <p style={{ marginTop: 6, fontSize: ".9rem", opacity: .9 }}>子ども向け英語学習PWAアプリ — プロジェクト全体マップ</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 14 }}>
          {["Next.js 15", "TypeScript", "Supabase", "Tailwind CSS", "Vercel", "PWA"].map(b => (
            <span key={b} style={{ background: "rgba(255,255,255,.25)", border: "1px solid rgba(255,255,255,.5)", borderRadius: 99, padding: "4px 14px", fontSize: ".78rem", fontWeight: 700 }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px 64px" }}>

        {/* DB統計 */}
        <Section title="📊 データベース（Supabase）">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { num: "172", label: "ベビー単語", color: "#f43f5e" },
              { num: "406", label: "小学生単語", color: "#f59e0b" },
              { num: "505", label: "中学生単語", color: "#14b8a6" },
              { num: "920", label: "ベビー問題文", color: "#6366f1" },
              { num: "1,110", label: "小学生問題文", color: "#92400e" },
            ].map(s => (
              <div key={s.label} style={{ flex: "1 1 110px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: s.color }}>{s.num}</div>
                <div style={{ fontSize: ".72rem", color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 実装済み */}
        <Section title="✅ 実装済み機能">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
            {[
              { icon: "🎨", title: "テーマ機能", desc: "5種類のカラーテーマ（ピンク・ミント・クリーム・茶色・ダーク）。全ページでlocalStorageと連動。フラッシュなし読み込み（useLayoutEffect）。", done: true },
              { icon: "📚", title: "難易度レベル", desc: "ベビー・小学生・中学生・高校生の4段階。選択した難易度はlocalStorageで永続化。ひらがな・漢字の表記が難易度で自動切替。", done: true },
              { icon: "🗂️", title: "単語帳ページ", desc: "Supabase連携（1000行制限対策：レベル別クエリ）。品詞バッジ・絵文字。音声読み上げボタン（Web Speech API）。", done: true },
              { icon: "🧩", title: "クイズページ", desc: "文章並び替え問題。選択済み単語は透過表示でそのまま残す。ドラッグ＆タップ両対応。日本語の横に音声ボタン。正解時も読み上げ。", done: true },
              { icon: "🏆", title: "チャレンジページ", desc: "「実力を試そう！」並び替えクイズ。別の文のディストラクター単語（特に前置詞）を混入。1日3問クリアで達成。", done: true },
              { icon: "🎯", title: "ミッション＆チケット", desc: "ミッション1：問題を解く（5問）。ミッション2：実力を試す（3問）。両方達成でチケット+1枚。0時自動リセット。", done: true },
              { icon: "🔊", title: "音声読み上げ", desc: "Web Speech API（外部API不要）。単語・文章ともに英語ネイティブ発音で読み上げ。rate=0.85で聞き取りやすく調整。", done: true },
              { icon: "📱", title: "PWA対応", desc: "@ducanh2912/next-pwa を使用。ホーム画面に追加可能。Vercelで本番デプロイ済み。", done: true },
            ].map(f => (
              <Card key={f.title}>
                <div style={{ fontWeight: 800, fontSize: ".85rem", marginBottom: 6 }}>{f.icon} {f.title}</div>
                <div style={{ fontSize: ".8rem", color: "#64748b", lineHeight: 1.65 }}>{f.desc}</div>
                <Tag color="#dcfce7" text="#166534" label="✔ 完成" />
              </Card>
            ))}
          </div>
        </Section>

        {/* 技術スタック */}
        <Section title="🛠️ 使用技術スタック">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { icon: "⚡", name: "Next.js 15\nApp Router" },
              { icon: "🔷", name: "TypeScript" },
              { icon: "💨", name: "Tailwind CSS" },
              { icon: "🗄️", name: "Supabase\nPostgreSQL" },
              { icon: "▲", name: "Vercel\nデプロイ" },
              { icon: "📲", name: "PWA" },
              { icon: "🔊", name: "Web Speech\nAPI" },
              { icon: "🗃️", name: "localStorage\n永続化" },
              { icon: "🎨", name: "5テーマ\nカラー" },
            ].map(t => (
              <div key={t.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 18px", minWidth: 90, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: "1.6rem" }}>{t.icon}</div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#64748b", whiteSpace: "pre-line" }}>{t.name}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ロードマップ */}
        <Section title="🚀 今後の実装ロードマップ">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                icon: "📋", title: "単語帳レイアウト変更（2列 → 1列）", prio: 4,
                desc: "現在の2カラムグリッドを1列の縦スクロールリストに変更。単語の詳細情報をより広く表示しやすくする。",
                tags: []
              },
              {
                icon: "🔤", title: "単語帳アルファベットジャンプボタン", prio: 3,
                desc: "画面上部にA〜Zのボタンを配置。タップするとそのアルファベットで始まる単語リストの先頭まで即スクロール。",
                tags: []
              },
              {
                icon: "👶", title: "ベビー解答欄のヒント枠", prio: 3,
                desc: "ベビーレベルのクイズ解答欄に、移動する単語のサイズに合わせた薄い枠（ガイド）を表示。字数のヒントになり難易度を下げる。",
                tags: []
              },
              {
                icon: "✉️", title: "れんらくちょう（AI文章生成）", prio: 4,
                desc: "その日の成績・達成ミッションをもとに、Claude APIがポジティブで保護者が課金したくなる連絡帳コメントを自動生成。",
                tags: [{ color: "#ede9fe", text: "#5b21b6", label: "🤖 Claude API 必要" }]
              },
              {
                icon: "🔡", title: "単語つくり機能（チケット消費型）", prio: 5,
                desc: "未取得単語の中から難易度が低い順に出題。①1文字目を「つくる枠」に移動 ②未取得単語すべての2文字目候補を表示・選択 ③3文字目以降も同様 ④単語が完成→取得済みに。チケットを1枚消費。",
                tags: [{ color: "#dbeafe", text: "#1e40af", label: "💾 DB設計変更あり" }]
              },
            ].map(f => (
              <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 14, borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.6rem", flexShrink: 0 }}>{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".88rem", fontWeight: 800 }}>{f.title}</div>
                  <div style={{ fontSize: ".78rem", color: "#64748b", marginTop: 4, lineHeight: 1.6 }}>{f.desc}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: 99, background: i < f.prio ? "#f43f5e" : "#e2e8f0" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    <Tag color="#fee2e2" text="#991b1b" label="未実装" />
                    {f.tags.map(tg => <Tag key={tg.label} color={tg.color} text={tg.text} label={tg.label} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 設計メモ */}
        <Section title="📝 設計メモ・補足">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
            {[
              { icon: "🔐", title: "取得済み単語の管理方式", desc: "現状：localStorageにword文字列配列で保存。今後：単語つくり機能・れんらくちょう実装のためSupabaseのusers/progressテーブルへの移行を検討。認証が必要になる可能性あり。" },
              { icon: "💳", title: "課金・サブスク設計", desc: "れんらくちょうAI機能はAPI費用が発生するため有料プランの目玉機能として位置づけ。チケット制・単語つくり機能は無料で遊べる日課として継続利用を促す設計。" },
              { icon: "🌐", title: "Supabase運用注意点", desc: "プロジェクト: pmvtabepucegmzejkveh.supabase.co。1000行上限対策：レベル別Promise.all並列クエリ実装済み。ON CONFLICT DO NOTHINGでupsert安全化済み。" },
              { icon: "🔊", title: "音声の品質について", desc: "Web Speech APIはブラウザ・OSによって音声品質が変わる。将来的により高品質なTTS（Google Cloud TTS・ElevenLabsなど）への移行も選択肢。費用対効果で判断。" },
            ].map(f => (
              <Card key={f.title}>
                <div style={{ fontWeight: 800, fontSize: ".85rem", marginBottom: 6 }}>{f.icon} {f.title}</div>
                <div style={{ fontSize: ".8rem", color: "#64748b", lineHeight: 1.65 }}>{f.desc}</div>
              </Card>
            ))}
          </div>
        </Section>

      </div>

      <div style={{ textAlign: "center", fontSize: ".75rem", color: "#94a3b8", padding: 24, borderTop: "1px solid #e2e8f0" }}>
        英語ボックス プロジェクトステータス — 最終更新: 2026年3月
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, whiteSpace: "nowrap" }}>{title}</h2>
        <div style={{ flex: 1, height: 2, background: "#e2e8f0", borderRadius: 2 }} />
      </div>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      {children}
    </div>
  );
}

function Tag({ color, text, label }: { color: string; text: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: ".7rem", fontWeight: 700, borderRadius: 99, padding: "2px 10px", marginTop: 8, background: color, color: text }}>
      {label}
    </span>
  );
}
