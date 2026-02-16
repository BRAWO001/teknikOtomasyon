// src/components/personel/PersonelStatsPanel.jsx
function StatCard({ title, value, sub, icon, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 shadow-sm transition active:scale-[0.99]
        ${active
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{title}</div>
          <div className="mt-1 text-[22px] font-extrabold text-zinc-900 dark:text-zinc-100">{value}</div>
          {sub ? <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</div> : null}
        </div>
        <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-[18px] dark:bg-zinc-800">{icon}</div>
      </div>
    </button>
  );
}

export default function PersonelStatsPanel({ summary, rangeLabel, tab, onSelectTab }) {
  const total = summary?.total ?? 0;
  const devam = summary?.devamEden ?? 0;
  const biten = summary?.biten ?? 0;

  const pct = total > 0 ? Math.round((biten / total) * 100) : 0;

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <StatCard
        title="Toplam İş"
        value={total}
        sub={rangeLabel}
        icon="📌"
        active={tab === "ALL"}
        onClick={() => onSelectTab("ALL")}
      />
      <StatCard
        title="Devam Eden"
        value={devam}
        sub="Durum < 100"
        icon="⏳"
        active={tab === "DEVAM"}
        onClick={() => onSelectTab("DEVAM")}
      />
      <StatCard
        title="Biten"
        value={biten}
        sub={`Tamamlanma: %${pct}`}
        icon="✅"
        active={tab === "BITEN"}
        onClick={() => onSelectTab("BITEN")}
      />
    </section>
  );
}
