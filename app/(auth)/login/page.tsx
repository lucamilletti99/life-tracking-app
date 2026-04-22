import { LoginCard } from "@/components/auth/LoginCard";
import { resolvePostLoginPath } from "@/lib/auth/session";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = resolvePostLoginPath(nextValue);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <LoginCard nextPath={nextPath} />
    </main>
  );
}
