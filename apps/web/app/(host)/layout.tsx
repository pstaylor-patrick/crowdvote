import { CheckSquare } from "@phosphor-icons/react/dist/ssr";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border px-6 py-3 backdrop-blur-sm bg-background/80 shadow-sm">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xl font-bold text-primary"
        >
          <CheckSquare size={24} weight="fill" />
          CrowdVote
        </a>
      </header>
      <main>{children}</main>
    </div>
  );
}
