-- ============================================================
-- 英語ボックス — Supabase スキーマ
-- ============================================================

-- questions テーブル（並び替え問題マスタ）
CREATE TABLE IF NOT EXISTS questions (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  level         text        NOT NULL CHECK (level IN ('baby', 'elementary', 'junior', 'high', 'toeic')),
  sentence      text        NOT NULL,   -- 完全な英文（例: "I like cats ."）
  japanese      text        NOT NULL,   -- 日本語訳（例: "私は猫が好きです。"）
  words         text[]      NOT NULL,   -- 並び替え用単語リスト（句読点除く）
  punctuation   text        NOT NULL DEFAULT '.',  -- 末尾句読点（常時表示・判定除外）
  hint          text,                  -- ヒント（オプション）
  created_at    timestamptz DEFAULT now()
);

-- user_answers テーブル（回答履歴）
CREATE TABLE IF NOT EXISTS user_answers (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL,  -- auth.users.id (認証実装後に外部キー設定)
  question_id   uuid        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct    boolean     NOT NULL,
  answered_at   timestamptz DEFAULT now()
);

-- wrong_answers テーブル（復習用間違い記録）
CREATE TABLE IF NOT EXISTS wrong_answers (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL,
  question_id   uuid        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  reviewed      boolean     NOT NULL DEFAULT false
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user_id_reviewed ON wrong_answers(user_id, reviewed);

-- ============================================================
-- サンプルデータ（各レベル2問ずつ）
-- ============================================================
INSERT INTO questions (level, sentence, japanese, words, punctuation, hint) VALUES
-- baby（2〜5歳）
('baby', 'I like cats .', 'わたしは ねこが すきです。',    ARRAY['I', 'like', 'cats'], '.', 'ねこ = cats'),
('baby', 'This is a dog .', 'これは いぬです。',           ARRAY['This', 'is', 'a', 'dog'], '.', 'いぬ = dog'),
('baby', 'I see a bird .', 'わたしは とりを みます。',     ARRAY['I', 'see', 'a', 'bird'], '.', 'とり = bird'),

-- elementary（小学生）
('elementary', 'I play soccer every day .', 'わたしは毎日サッカーをします。',    ARRAY['I', 'play', 'soccer', 'every', 'day'], '.', 'every day = まいにち'),
('elementary', 'She has a red umbrella .', '彼女は赤いかさを持っています。',      ARRAY['She', 'has', 'a', 'red', 'umbrella'], '.', 'red = あかい'),
('elementary', 'We go to school by bus .', 'わたしたちはバスで学校へ行きます。',  ARRAY['We', 'go', 'to', 'school', 'by', 'bus'], '.', 'by bus = バスで'),

-- junior（中学生）
('junior', 'I have been studying English for three years .', '私は3年間英語を勉強しています。',
  ARRAY['I', 'have', 'been', 'studying', 'English', 'for', 'three', 'years'], '.', '現在完了進行形'),
('junior', 'Could you tell me the way to the station ?', '駅への道を教えていただけますか。',
  ARRAY['Could', 'you', 'tell', 'me', 'the', 'way', 'to', 'the', 'station'], '?', '丁寧な依頼表現'),
('junior', 'She is the most popular singer in Japan .', '彼女は日本で最も人気のある歌手です。',
  ARRAY['She', 'is', 'the', 'most', 'popular', 'singer', 'in', 'Japan'], '.', '最上級'),

-- high（高校生）
('high', 'It is important that we protect the environment .', '私たちが環境を守ることは重要です。',
  ARRAY['It', 'is', 'important', 'that', 'we', 'protect', 'the', 'environment'], '.', '仮主語構文'),
('high', 'Had I known the truth , I would have acted differently .', 'もし真実を知っていたら、違う行動をとっていたでしょう。',
  ARRAY['Had', 'I', 'known', 'the', 'truth', ',', 'I', 'would', 'have', 'acted', 'differently'], '.', '仮定法過去完了（倒置）'),

-- toeic（社会人）
('toeic', 'The project was completed ahead of schedule .', 'プロジェクトは予定より早く完了した。',
  ARRAY['The', 'project', 'was', 'completed', 'ahead', 'of', 'schedule'], '.', 'ahead of schedule = 予定より早く'),
('toeic', 'Please be advised that the meeting has been postponed until further notice .', '会議は追って通知があるまで延期されましたのでご承知ください。',
  ARRAY['Please', 'be', 'advised', 'that', 'the', 'meeting', 'has', 'been', 'postponed', 'until', 'further', 'notice'], '.', 'ビジネスメール定型文')
ON CONFLICT DO NOTHING;
