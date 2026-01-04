// SatinalmaShareLinkBar.jsx
export default function SatinalmaShareLinkBar({ shareUrl, copied, onCopy }) {
  if (!shareUrl) return null;

  return (
    <div
      style={{
        marginBottom: "0.75rem",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      <label
        style={{
          fontSize: 12,
          color: "#4b5563",
          fontWeight: 500,
          marginRight: 4,
          minWidth: 130,
        }}
      >
        Tedarikçi Paylaşım Linki:
      </label>
      <input
        value={shareUrl}
        readOnly
        style={{
          flexGrow: 1,
          minWidth: 250,
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "4px 8px",
          fontSize: 12,
          backgroundColor: "#f9fafb",
        }}
      />
      <button
        type="button"
        onClick={onCopy}
        style={{
          padding: "5px 10px",
          fontSize: 12,
          borderRadius: 6,
          border: "1px solid #2563eb",
          backgroundColor: "#2563eb",
          color: "#fff",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {copied ? "Kopyalandı ✓" : "Linki Kopyala"}
      </button>
    </div>
  );
}
