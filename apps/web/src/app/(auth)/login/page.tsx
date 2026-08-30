export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue.
          </p>
        </div>
        {/* Login form will be implemented in Phase 2 */}
        <p className="text-center text-sm text-muted-foreground">
          Auth UI coming in Phase 2
        </p>
      </div>
    </main>
  );
}
