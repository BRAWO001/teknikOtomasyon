// pages/rapor-excel.jsx
import axios from "axios";
import { useMemo, useState } from "react";
import { getCookie } from "@/utils/cookieService";

function toDateInputValue(d) {
  if (!d) return "";
  try {
    const x = new Date(d);
    return x.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function RaporExcelPage() {
  const [siteId, setSiteId] = useState("");
  const [personelId, setPersonelId] = useState("");
  const [start, setStart] = useState(toDateInputValue(new Date()));
  const [end, setEnd] = useState(toDateInputValue(new Date()));

  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState("");

  const params = useMemo(() => {
    const p = {};
    if (siteId && Number(siteId) > 0) p.siteId = Number(siteId);
    if (personelId && Number(personelId) > 0) p.personelId = Number(personelId);

    // ✅ tarih: sadece ikisi birlikte gönder
    if (start && end) {
      p.start = start; // "YYYY-MM-DD"
      p.end = end;     // "YYYY-MM-DD"
    }
    return p;
  }, [siteId, personelId, start, end]);

  const downloadRaporExcel = async (paramsObj) => {
    const token = getCookie("AuthToken_01");

    const res = await axios.get(
      `https://pilotapisrc.com/api/yoneticiraporu/IS-EMIRLERI-DETAYLI-RAPOR-EXCEL`,
      {
        params: paramsObj,
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `is-emirleri-rapor.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    try {
      setErr("");
      setDownloading(true);
      await downloadRaporExcel(params);
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const msg =
        status === 401
          ? "401: Token yok/expired. Tekrar giriş yap."
          : status === 403
          ? "403: Yetkin yok (Authorize/Roles/Policy)."
          : status
          ? `Hata: ${status}`
          : "İndirme hatası oluştu (CORS/SSL olabilir).";
      setErr(msg);
    } finally {
      setDownloading(false);
    }
  };


  const downloadSatinAlmaExcel = async (paramsObj) => {
  const token = getCookie("AuthToken_01");

  const res = await axios.get(
    "https://pilotapisrc.com/api/yoneticiraporu/SATIN-ALMA-DETAYLI-RAPOR-EXCEL",
    {
      params: paramsObj,
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "satinalma-rapor.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};





  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-xl mx-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          İş Emirleri Raporu Excel
        </h1>

        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Filtreler opsiyonel. Tarih filtresi için start ve end ikisi birlikte gider.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-700 dark:text-zinc-200">
            SiteId (opsiyonel)
            <input
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              placeholder="örn: 12"
            />
          </label>

          <label className="text-xs text-zinc-700 dark:text-zinc-200">
            PersonelId (opsiyonel)
            <input
              value={personelId}
              onChange={(e) => setPersonelId(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              placeholder="örn: 34"
            />
          </label>

          <label className="text-xs text-zinc-700 dark:text-zinc-200">
            Start
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </label>

          <label className="text-xs text-zinc-700 dark:text-zinc-200">
            End
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </label>
        </div>

        {err ? (
          <div className="mt-3 text-xs text-red-600 dark:text-red-400">
            {err}
          </div>
        ) : null}

        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white
            ${downloading ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-zinc-800"}
          `}
        >
          {downloading ? "İndiriliyor..." : "Excel İndir"}
        </button>

        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Gönderilen params: {JSON.stringify(params)}
        </div>

        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Endpoint: https://pilotapisrc.com/api/yoneticiraporu/isEmirleriDetayliYoneticiRaporuExcel
        </div>


            <button
  onClick={() => downloadSatinAlmaExcel(params)}
  disabled={downloading}
  className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
>
  Satın Alma Excel İndir
</button>





      </div>
    </div>
  );
}
