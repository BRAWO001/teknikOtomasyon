




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

function toDateInputValue(d) {
  try {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return "";
  }
}

function getDefaultRange() {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1); // 1 ay önce
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
}

// ✅ default: 1 ay önce -> bugün
const defaults = getDefaultRange();

const [startDate, setStartDate] = useState(defaults.startDate);
const [endDate, setEndDate] = useState(defaults.endDate);

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

  const fetchRecords = async () => {
    if (!personelId) return;

    setLoading(true);
    setError(null);

    try {
      let query = `satinalma/taleplerim?personelId=${personelId}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await getDataAsync(query);
      setRecords(res || []);
    } catch (err) {
      console.error("TALEPLERIM ERROR:", err);
      setError("Talepler alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="mx-auto max-w-5xl px-4 py-5">
      {/* Header */}
      <div className="mb-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">
          Satın Alma Taleplerim
        </h1>

        <p className="mt-1 text-[13px] text-zinc-600">
          Bu listede <strong>TalepEden</strong> olarak sizin oluşturduğunuz satın alma talepleri görünür.
          Kartlara tıklayarak teklif detayına gidebilirsiniz.
        </p>

        {personel && (
          <div className="mt-2 text-[12px] text-emerald-700">
            <span className="font-semibold">Kullanıcı:</span>{" "}
            {personel.ad ?? personel.Ad} {personel.soyad ?? personel.Soyad}
          </div>
        )}
      </div>

      {/* Filtre */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-zinc-600">Başlangıç Tarihi</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 text-black py-1 text-[12px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-zinc-600">Bitiş Tarihi</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-black text-[12px]"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !personelId}
          className="rounded-md border border-emerald-600 bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Yükleniyor..." : "Filtrele"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            // filtreleri temizleyip tekrar çek
            setTimeout(() => fetchRecords(), 0);
          }}
          disabled={loading || !personelId}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Filtreyi Temizle
        </button>
      </form>

      {/* Hata */}
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Boş */}
      {!loading && records.length === 0 && !error && (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-center text-[13px] text-zinc-600">
          Seçili tarih aralığında talebiniz bulunmuyor.
        </div>
      )}

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
        {loading ? (
          <div className="px-4 py-4 text-[13px] text-zinc-600">Yükleniyor...</div>
        ) : (
          records.map((item) => (
            <SatinAlmaOnaylananItem
              key={item.id ?? item.Id}
              item={item}
              formatDateTime={formatDateTimeTR}
              formatDateOnly={formatDateOnlyTR}
            />
          ))
        )}
      </div>
    </div>
  );
}
