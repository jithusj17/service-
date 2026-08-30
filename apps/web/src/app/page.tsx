export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Service Platform
        </h1>
        <p className="text-lg text-muted-foreground">
          Local Service Management Platform — Foundation ready.
        </p>
        <div className="flex gap-4 justify-center">
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ Next.js
          </span>
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ Tailwind CSS
          </span>
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ TanStack Query
          </span>
        </div>
      </div>
    </main>
  );
}
