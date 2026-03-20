export type Level = "baby" | "elementary" | "junior" | "high" | "toeic";

export interface Question {
  id: string;
  level: Level;
  sentence: string;      // 完全な英文（例: "I like cats ."）
  japanese: string;      // 日本語訳
  words: string[];       // 並び替え用の単語リスト（句読点除く）
  punctuation: string;   // 末尾句読点（例: "." "?" "!"）常時表示・判定除外
  hint: string | null;   // ヒント（オプション）
  word?: string | null;  // 対象単語（取得済み判定に使用）
  created_at: string;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  answered_at: string;
}

export interface WrongAnswer {
  id: string;
  user_id: string;
  question_id: string;
  registered_at: string;
  reviewed: boolean;
}

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: Question;
        Insert: Omit<Question, "id" | "created_at">;
        Update: Partial<Omit<Question, "id" | "created_at">>;
      };
      user_answers: {
        Row: UserAnswer;
        Insert: Omit<UserAnswer, "id" | "answered_at">;
        Update: Partial<Omit<UserAnswer, "id">>;
      };
      wrong_answers: {
        Row: WrongAnswer;
        Insert: Omit<WrongAnswer, "id" | "registered_at">;
        Update: Partial<Omit<WrongAnswer, "id">>;
      };
    };
  };
}
