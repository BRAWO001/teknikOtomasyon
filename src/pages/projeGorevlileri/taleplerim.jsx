// pages/projeGorevlileri/taleplerim.jsx
import { useEffect, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import SatinAlmaOnaylananItem from "@/components/SatinAlmaOnaylananItem";

function formatDateTimeTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatDateOnlyTR(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export default function ProjeGorevlileriTaleplerimPage() {
  const [personel, setPersonel] = useState(null);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Personel cookie'sini oku
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      const parsed = JSON.parse(cookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  const personelId = personel ? personel.id ?? personel.Id : null;

  // Listeyi çek
  const fetchRecords = async () => {
    if (!personelId) return;

    setLoading(true);
    setError(null);

    try {
      let query = `satinalma/taleplerim?personelId=${personelId}`;

      if (startDate) {
        query += `&startDate=${startDate}`;
      }
      if (endDate) {
        query += `&endDate=${endDate}`;
      }

      const res = await getDataAsync(query);
      setRecords(res || []);
    } catch (err) {
      console.error("TALEPLERIM ERROR:", err);
      setError("Talepler alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // PersonelId geldiğinde default listeyi çek
  useEffect(() => {
    if (!personelId) return;
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personelId]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "1rem 1.25rem",
        fontSize: 14,
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      <h1
        style={{
          marginBottom: "0.75rem",
          fontSize: 20,
          fontWeight: 600,
          color: "#000",
        }}
      >
        Satın Alma Taleplerim
      </h1>

      <p
        style={{
          marginTop: 0,
          marginBottom: "0.75rem",
          fontSize: 13,
          color: "#4b5563",
        }}
      >
        Bu listede <strong>TalepEden</strong> olarak sizin oluşturduğunuz
        satın alma talepleri görünür. Kartlara tıklayarak teklif detayına
        gidebilirsiniz.
      </p>

      {/* Filtre formu */}
      <form
        onSubmit={handleFilterSubmit}
        style={{
          marginBottom: "0.75rem",
          padding: "0.75rem 0.9rem",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#4b5563" }}>
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#4b5563" }}>
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !personelId}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #16a34a",
            backgroundColor: "#16a34a",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Yükleniyor..." : "Filtrele"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            fontSize: 13,
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            borderRadius: 4,
            padding: "6px 10px",
          }}
        >
          {error}
        </div>
      )}

      {!loading && records.length === 0 && !error && (
        <div
          style={{
            fontSize: 13,
            color: "#4b5563",
            backgroundColor: "#f9fafb",
            borderRadius: 4,
            padding: "0.75rem 0.9rem",
          }}
        >
          Seçili tarih aralığında talebiniz bulunmuyor.
        </div>
      )}

      <div
        style={{
          marginTop: "0.5rem",
          borderRadius: 6,
          border: "1px solid #bbf7d0",
          backgroundColor: "#f0fdf4",
        }}
      >
        {records.map((item) => (
          <SatinAlmaOnaylananItem
            key={item.id ?? item.Id}
            item={item}
            formatDateTime={formatDateTimeTR}
            formatDateOnly={formatDateOnlyTR}
          />
        ))}
      </div>
    </div>
  );
}
