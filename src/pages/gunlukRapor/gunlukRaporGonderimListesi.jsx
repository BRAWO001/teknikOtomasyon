import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function formatDateTR(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("tr-TR");
  } catch {
    return "-";
  }
}

export default function SonIkiAyGonderenlerPage() {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // AUTH
  useEffect(() => {
    const raw = getClientCookie("PersonelUserInfo");
    if (!raw) router.push("/");
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDataAsync(
        "gunlukRapor/son-iki-ay/gonderenler"
      );
      setData(res?.data || res?.Data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-2 space-y-2">
      {/* HEADER */}
      <div className="flex justify-between items-center text-[12px]">
        <div className="font-semibold">
          Son 2 Ay Günlük Rapor Gönderem Listesi
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => router.push("/")}
            className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded"
          >
            Ana Sayfa
          </button>

          <button
            onClick={loadData}
            className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* LIST */}
      {loading && (
        <div className="text-center text-[12px] py-6">
          Yükleniyor...
        </div>
      )}

      {!loading &&
        data.map((g, i) => (
          <div
            key={i}
            className="border rounded p-2 bg-white dark:bg-zinc-900"
          >
            {/* TARİH */}
            <div className="flex justify-between text-[11px] mb-1">
              <div className="font-semibold">
                {formatDateTR(g.tarih || g.Tarih)}
              </div>
              <div className="text-zinc-500">
                {g.gonderenSayisi || g.GonderenSayisi} kişi
              </div>
            </div>

            {/* İSİMLER GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
              {(g.gonderenler || g.Gonderenler || []).map(
                (ad, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] px-1 py-[2px] rounded bg-zinc-100 dark:bg-zinc-800 truncate"
                  >
                    {ad}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
    </div>
  );
}