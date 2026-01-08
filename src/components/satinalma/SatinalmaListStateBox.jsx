export default function SatinalmaListStateBox({ type, children }) {
  const styles =
    type === "error"
      ? "border-red-300 bg-red-50 text-red-700"
      : "border-zinc-200 bg-white text-zinc-600";

  return (
    <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}
