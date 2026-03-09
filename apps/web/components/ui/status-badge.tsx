import { CircleDashed, Users, Lightning, CheckCircle } from "@phosphor-icons/react/dist/ssr";

const statusConfig: Record<string, { icon: typeof CircleDashed; bg: string; text: string }> = {
  draft: { icon: CircleDashed, bg: "bg-muted", text: "text-muted-foreground" },
  lobby: { icon: Users, bg: "bg-yellow-100", text: "text-yellow-800" },
  active: { icon: Lightning, bg: "bg-green-100", text: "text-green-800" },
  finished: {
    icon: CheckCircle,
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    icon: CircleDashed,
    bg: "bg-muted",
    text: "text-muted-foreground",
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon size={14} weight="bold" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
