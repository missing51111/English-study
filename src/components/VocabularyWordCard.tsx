"use client";

import { useCallback } from "react";
import StudyItemImage from "@/components/StudyItemImage";
import { EMOJI_MAP } from "@/lib/emojiMap";
import { isPhraseItem, primaryPartOfSpeech } from "@/lib/vocabularyPlan";
import type { Theme } from "@/lib/themes";

type Level = "baby" | "elementary" | "junior" | "high" | "toeic";

type WordCardWord = {
  id: string;
  word: string;
  meaning: string;
  part_of_speech: string | null;
  image_name?: string | null;
  image_status?: string | null;
};

const POS_JA: Record<string, string> = {
  noun: "名詞",
  verb: "動詞",
  adj: "形容詞",
  adv: "副詞",
  phrase: "熟語",
  conj: "接続詞",
  prep: "前置詞",
};

const POS_BABY: Record<string, string> = {
  noun: "なまえ",
  verb: "うごき",
  adj: "ようす",
  adv: "ようす\nことば",
  phrase: "ひとこと",
};

const POS_COLOR: Record<string, string> = {
  noun: "bg-blue-100 text-blue-700",
  verb: "bg-green-100 text-green-700",
  adj: "bg-orange-100 text-orange-700",
  adv: "bg-purple-100 text-purple-700",
  phrase: "bg-pink-100 text-pink-700",
  conj: "bg-teal-100 text-teal-700",
  prep: "bg-gray-100 text-gray-600",
};

type VocabularyWordCardProps = {
  word: WordCardWord;
  level: Level;
  emojiBg: string;
  focusLabel: string;
  t: Theme;
  acquired: boolean;
};

export default function VocabularyWordCard({
  word,
  level,
  emojiBg,
  focusLabel,
  t,
  acquired,
}: VocabularyWordCardProps) {
  const isPhrase = isPhraseItem(word);
  const emoji = !isPhrase ? (EMOJI_MAP[word.word.toLowerCase()] ?? null) : null;
  const pos = primaryPartOfSpeech(word.part_of_speech);
  const posLabel = pos
    ? level === "baby"
      ? (POS_BABY[pos] ?? null)
      : (POS_JA[pos] ?? null)
    : null;
  const posColor = pos ? (POS_COLOR[pos] ?? "bg-gray-100 text-gray-600") : null;

  const speakWord = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word.word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }, [word.word]);

  return (
    <div
      className={`relative rounded-xl border ${t.border} shadow-sm flex items-stretch overflow-hidden transition-opacity ${
        acquired ? t.card : "bg-gray-100"
      } ${acquired ? "" : "opacity-50"}`}
    >
      <div className={`relative flex-shrink-0 ${acquired ? emojiBg : "bg-gray-200"}`} style={{ width: "5rem" }}>
        <StudyItemImage
          id={word.id}
          kind="words"
          alt={`${word.word} image`}
          imageName={word.image_name}
          imageStatus={word.image_status}
          className="h-full min-h-[88px] rounded-none"
          sizes="80px"
        />
        {acquired && emoji && (
          <div className="pointer-events-none absolute bottom-1 right-1 rounded-full bg-white/85 px-1 text-lg leading-none">
            {emoji}
          </div>
        )}
        {!acquired && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-200/55">
            <span style={{ fontSize: "1.6rem" }}>🔒</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 px-3 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {acquired ? (
            <>
              <p className={`${t.subText} text-sm leading-none truncate`}>{word.meaning}</p>
              <span className="flex-shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700">
                {focusLabel}
              </span>
              {posLabel && (
                <span
                  className={`flex-shrink-0 rounded-md px-1.5 py-0.5 font-bold leading-none ${posColor} ${
                    level === "baby" ? "text-[9px]" : "text-[10px]"
                  }`}
                >
                  {posLabel.replace("\n", "")}
                </span>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm leading-none">???</p>
          )}
        </div>
        {acquired ? (
          <p className={`font-bold ${t.bodyText} ${isPhrase ? "text-lg" : "text-xl"} leading-tight`}>{word.word}</p>
        ) : (
          <p className="font-bold text-gray-400 text-xl leading-tight tracking-widest">
            {"*".repeat(Math.min(word.word.replace(/\s+/g, "").length, 8))}
          </p>
        )}
      </div>

      {acquired && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            speakWord();
          }}
          className="bg-white flex items-center justify-center flex-shrink-0 opacity-40 hover:opacity-100 active:scale-90 transition-all px-3"
          style={{ fontSize: "1.5rem" }}
          aria-label={`${word.word}の音声`}
        >
          🔊
        </button>
      )}
    </div>
  );
}
