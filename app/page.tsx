export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Leftover Analyzer
        </h1>
      </header>
      <main className="grid flex-1 grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Capture
          </h2>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Results &amp; recommendation
          </h2>
        </section>
      </main>
    </div>
  );
}
