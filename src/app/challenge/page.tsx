import { Suspense } from "react";
import ChallengePage from "@/components/ChallengePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">よみこみちゅう…</div>}>
      <ChallengePage />
    </Suspense>
  );
}
