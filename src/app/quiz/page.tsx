import { Suspense } from "react";
import QuizPage from "@/components/QuizPage";

export default function Quiz() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-lg font-bold">よみこみちゅう…</div>}>
      <QuizPage />
    </Suspense>
  );
}
