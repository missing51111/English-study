-- wordsテーブルにカラム追加
-- 実行順：このファイルを先に実行してから seed_*.sql を実行

ALTER TABLE words
  -- 読み・例文
  ADD COLUMN IF NOT EXISTS reading     text,          -- カタカナ読み（例: キャット）
  ADD COLUMN IF NOT EXISTS example_en  text,          -- 英語例文（後日実装・今は空白可）
  ADD COLUMN IF NOT EXISTS example_ja  text,          -- 日本語訳例文（後日実装・今は空白可）

  -- 動詞活用（baby以外で将来実装・動詞以外はNULL）
  ADD COLUMN IF NOT EXISTS verb_past   text,          -- 過去形（例: ran / ate / played）
  ADD COLUMN IF NOT EXISTS verb_ing    text,          -- 進行形（例: running / eating）
  ADD COLUMN IF NOT EXISTS verb_future text;          -- 未来形（例: will run）※通常 "will + 原形" なので省略可だが明示用に保持
