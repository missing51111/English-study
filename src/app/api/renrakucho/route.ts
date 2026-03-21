import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { level, correctCount, totalCount, acquiredCount, quizCount, levelLabel } =
      await req.json();

    const accuracy =
      totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const isBabyOrKid = level === "baby" || level === "elementary";

    const system = isBabyOrKid
      ? `あなたは子ども向け英語学習アプリ「英語BOX」のAIコーチです。
保護者へ向けて、お子さんの今日の学習をひらがな・カタカナ中心の優しい言葉で褒めてください。
ルール：
- 80文字以内のコメント
- ポジティブで温かく、具体的な数字で褒める
- 保護者が「続けさせたい」と感じる内容
- 絵文字を1〜2個使う
- ひらがな・カタカナ主体（難しい漢字は使わない）`
      : `あなたは英語学習アプリ「英語BOX」のAIコーチです。
保護者・本人へ向けて、今日の学習成績をもとに励ましのメッセージを生成してください。
ルール：
- 100文字以内の短いコメント
- ポジティブで具体的な数字を使う
- 継続したくなる内容
- 絵文字を1〜2個使う
- 丁寧な敬語`;

    const userMsg = `今日の成績：
- 難易度: ${levelLabel}
- 問題数: ${totalCount}問 / 正解: ${correctCount}問（正答率 ${accuracy}%）
- 取得済み単語数: ${acquiredCount}語
- 今日解いた問題数: ${quizCount}問

保護者向けコメントを生成してください。`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return NextResponse.json({ comment: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
