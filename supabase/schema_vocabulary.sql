-- ============================================================
-- 単語マスタ（語彙コレクション用）
-- ============================================================

CREATE TABLE IF NOT EXISTS words (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  level         text        NOT NULL CHECK (level IN ('baby', 'elementary', 'junior', 'high', 'toeic')),
  word          text        NOT NULL,
  meaning       text        NOT NULL,   -- 日本語訳
  part_of_speech text,                  -- n./v./adj./adv./phr. など
  created_at    timestamptz DEFAULT now(),
  UNIQUE(word, level)
);

CREATE INDEX IF NOT EXISTS idx_words_level ON words(level);
