# 英語学習アプリ — CLAUDE.md

## プロジェクト概要

英語学習をゲーム化したWebアプリ。
学習の中心は「英文並び替え問題」で、復習・収集・報酬（ガチャ）のループで継続を促す。
対象年齢：2歳〜高校生（難易度別UI切り替え）

## 技術スタック

- フロントエンド：Next.js 15（App Router）
- バックエンド：Supabase（Auth + DB）
- デプロイ：Vercel

---

## コア設計思想

- 学習 → 復習 → 報酬（ガチャ）のループ
- ミッションによる継続促進（スタミナ制なし・クイズ回数制限なし）
- 学習状況の可視化（保護者画面）
- 難易度別UI（ベビー〜高校生）で年齢に合わせた表示

---

## 難易度設計

| ID | 表示名 | 対象 | 無料/課金 | UIトーン |
|---|---|---|---|---|
| baby | ベビー | 2〜5歳 | 無料 | ひらがなのみ・ポップ・ピンク |
| elementary | 小学生 | 小学生 | 無料 | 小1〜3漢字のみ・明るい黄色 |
| junior | 中学生 | 中学生 | 課金（PRO） | 小学全漢字＋中学漢字・青 |
| high | 高校生 | 高校生 | 課金（PRO） | 常用漢字全般・紫 |
| toeic | TOEIC | 社会人 | 課金（PRO） | ビジネス英語・グレー |

---

## カラーテーマ（5種類）

ユーザーが画面右上の丸ボタンで切り替え可能。

| ID | 名前 | 概要 |
|---|---|---|
| dark | ダーク | 黒背景・インディゴアクセント |
| pink | ピンク | 淡ローズ背景・白カード |
| mint | ミント | 淡ティール背景・白カード |
| cream | クリーム | 淡アンバー背景・白カード |
| mono | グレー | 淡グレー背景・白カード |

全テーマはWCAG AA基準（コントラスト比4.5:1以上）準拠。

---

## 実装済み機能

- ホーム画面（難易度セレクター・ミッション・チケット表示・保護者パネル・テーマ切替）
- 並び替え問題UI（/quiz）— Supabase連携済み・モックフォールバックあり
- 難易度別UIテキスト（学年別漢字配当表準拠）

### 実装済みファイル

| ファイル | 説明 |
|---|---|
| src/components/HomePage.tsx | ホーム画面。難易度・テーマ切替対応 |
| src/components/QuizPage.tsx | 並び替え問題。タップ＋ドラッグ対応・Supabase連携 |
| src/lib/supabase.ts | Supabaseクライアント |
| src/types/database.ts | DB型定義 |
| supabase/schema.sql | questionsテーブル＋サンプルデータSQL |

---

## 未実装（優先順）

1. **単語・問題データ整備**（schema.sqlのサンプルをSupabaseに投入）
2. **スタミナ消費・ミッション更新のAPI実装**
3. **wrong_answers登録・復習ロジック（/review）**
4. **ガチャロジック（/gacha）**
5. **語彙コレクション（/vocabulary）**
6. **認証（Supabase Auth）**— 現在はmock user_id使用
7. **課金・PRO解放**

---

## Supabase セットアップ手順

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. `supabase/schema.sql` をSQL Editorで実行
3. `.env.local` にURLとAnon Keyを設定：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. `.env.local` 未設定の場合はモックデータで動作します

---

## データベース設計（Supabase）

### questionsテーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | PK |
| level | text | baby/elementary/junior/high/toeic |
| sentence | text | 完全な英文（例: "I like cats ."） |
| japanese | text | 日本語訳 |
| words | text[] | 並び替え用単語リスト（句読点除く） |
| punctuation | text | 末尾句読点（常時表示・判定除外） |
| hint | text | ヒント（オプション） |
| created_at | timestamptz | 作成日時 |

### 主要テーブル一覧

| テーブル名 | 役割 |
|---|---|
| users | ユーザー情報 |
| user_state | チケット等の状態 |
| words | 単語マスタ |
| sentences | 例文マスタ |
| questions | 問題マスタ ✅実装済み |
| user_answers | 回答履歴 ✅実装済み |
| wrong_answers | 間違い記録（復習用）✅実装済み |
| missions | ミッションマスタ |
| user_missions | ユーザーのミッション進捗 |
| word_groups | 単語グループ（動詞変化形など） |
| user_word_groups | ユーザーの取得済みグループ |
| gacha_tickets | ガチャチケット |
| gacha_results | ガチャ結果履歴 |

---

## 機能仕様詳細

### 並び替え問題（/quiz）

- questionsテーブルから問題取得（未設定時はモックデータ）
- URLパラメータ：`/quiz?level=baby`
- 単語をシャッフルして表示
- タップで選択 → スロットに追加
- ドラッグでスロット内並び替え
- 判定：`slots.join(' ') === words.join(' ')`（句読点は常時表示・判定除外）
- 正解/不正解をuser_answersに保存
- 不正解の場合wrong_answersに登録（既存未復習レコードは重複なし）

### ミッション

- 日単位でリセット
- 種類：並び替え問題数 / 復習数
- 全クリアでガチャチケット1枚獲得

### ガチャチケット

- ミッション全クリアで獲得
- チケット1枚消費で単語獲得
- 未取得単語を優先抽選

### 復習（/review）

- データ元：wrong_answers テーブル
- 前日の間違いを取得 → 再出題
- 正解 → `reviewed = true`
- 不正解 → 今日の日付で再登録（翌日持ち越し）

### 保護者パネル（小学生以下のみ）

- 折りたたみ式
- 閉じた状態：正答率・今週の単語数・残りの単語数を常時表示
- 開いた状態：7日間グラフ・詳細進捗・自動コメント
- PRO誘導ボタン（もっとくわしい記録を見る）

---

## ディレクトリ構成

```
src/
  app/
    page.tsx          # ホーム（/）
    quiz/
      page.tsx        # 並び替え問題（/quiz）
    review/
      page.tsx        # 復習（/review）— 未実装
    gacha/
      page.tsx        # ガチャ（/gacha）— 未実装
    vocabulary/
      page.tsx        # 語彙コレクション（/vocabulary）— 未実装
  components/
    HomePage.tsx
    QuizPage.tsx
  lib/
    supabase.ts
  types/
    database.ts
supabase/
  schema.sql          # テーブル定義＋サンプルデータ
```

---

## 開発上の注意

- 1タスクずつ実装・確認してから次に進む
- Supabaseのテーブル構造を変える場合は必ず確認を取ること
- ミッション更新は既存のbootstrap処理と整合性を保つこと
- スタミナ制なし・クイズ回数制限なし（ミッションで継続促進）
- 句読点（`.?!,`）は問題の単語リストに含めず、UI側で常時表示する
- 認証実装前は `mock user_id = 00000000-0000-0000-0000-000000000000` を使用
