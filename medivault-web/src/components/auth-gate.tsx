import Link from "next/link";

export function AuthSetupRequired({ surface }: { surface: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef3f1] px-5 text-[#101c1c]">
      <section className="w-full max-w-[520px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(10,31,31,0.12)]">
        <p className="text-[13px] font-black text-[#ba563d]">Production auth setup required</p>
        <h1 className="mt-2 text-[26px] font-black leading-tight text-[#102323]">Supabase is not available in this build</h1>
        <p className="mt-3 text-[14px] leading-6 text-[#65716f]">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Railway, then redeploy or restart before using the {surface}.
        </p>
        <Link href="/login" className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
          Go to login
        </Link>
      </section>
    </main>
  );
}

export function SessionLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef3f1] px-5 text-[#101c1c]">
      <div className="w-full max-w-[430px] rounded-lg bg-white p-5 text-center shadow-[0_24px_70px_rgba(10,31,31,0.12)]">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dce9e5] border-t-[#0a7d6e]" />
        <p className="mt-4 text-[13px] font-bold text-[#65716f]">Checking secure session</p>
      </div>
    </main>
  );
}
