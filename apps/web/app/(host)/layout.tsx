export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-3">
        <a href="/dashboard" className="text-xl font-bold text-primary">
          CrowdVote
        </a>
      </header>
      <main>{children}</main>
    </div>
  );
}
