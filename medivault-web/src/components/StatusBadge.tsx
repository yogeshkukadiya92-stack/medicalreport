type Status = 'normal' | 'borderline' | 'high' | 'low' | 'critical';

const cfg: Record<Status, { label: string; dot: string; text: string; border: string; bg: string }> = {
  normal:     { label: 'Normal',     dot: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-l-emerald-500', bg: 'bg-emerald-50' },
  borderline: { label: 'Borderline', dot: 'bg-amber-500',   text: 'text-amber-700',   border: 'border-l-amber-500',   bg: 'bg-amber-50' },
  high:       { label: 'High',       dot: 'bg-red-500',     text: 'text-red-700',     border: 'border-l-red-500',     bg: 'bg-red-50' },
  low:        { label: 'Low',        dot: 'bg-blue-500',    text: 'text-blue-700',    border: 'border-l-blue-500',    bg: 'bg-blue-50' },
  critical:   { label: 'Critical',   dot: 'bg-red-700',     text: 'text-red-800',     border: 'border-l-red-700',     bg: 'bg-red-100' },
};

export function getStatusCfg(status: string) {
  return cfg[(status as Status)] ?? cfg.normal;
}

export default function StatusBadge({ status }: { status: string }) {
  const c = getStatusCfg(status);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
