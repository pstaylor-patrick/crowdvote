export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
