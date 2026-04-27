import { GoalDetailClient } from "./GoalDetailClient";

// With output: 'export', every dynamic route needs generateStaticParams.
// Goals are user-specific (stored in Supabase) so we can't enumerate IDs
// at build time — we return an empty array and declare dynamicParams = false
// to tell Next.js "this route has no pre-built variants; rely on client-side
// routing". Capacitor falls back to index.html for unknown paths, so
// useParams() in GoalDetailClient receives the real ID at runtime.
export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function GoalDetailPage() {
  return <GoalDetailClient />;
}
