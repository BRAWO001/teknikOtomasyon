



// src/pages/YonetimKurulu/index.jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";
import KararCards from "@/components/ProjeYonetimKurulu/KararCards";

export default function YonetimKuruluIndexPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");

  const [kararlar, setKararlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isPatron = useMemo(() => Number(personel?.rol) === 90, [personel]);

  // 1) Cookie -> personel
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      const parsed = JSON.parse(cookie);
      const p = parsed?.personel ?? parsed;
      setPersonel(p);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  // 2) PersonelKodu ile site(ler) getir
  useEffect(() => {
    if (!personel?.personelKodu) return;

    let cancelled = false;
    const loadSites = async () => {
      try {
        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/personel/${encodeURIComponent(
            personel.personelKodu
          )}`
        );
        if (cancelled) return;

        const normalized = Array.isArray(list) ? list : list ? [list] : [];
        setSites(normalized);

        const firstSiteId = normalized?.[0]?.siteId;
        if (firstSiteId) setSiteId(String(firstSiteId));
      } catch (err) {
        console.error("SITE LIST ERROR:", err);
        if (cancelled) return;
        setSites([]);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
  }, [personel?.personelKodu]);

  // 3) Kararları getir (siteId değişince)
  useEffect(() => {
    if (!siteId) return;
    fetchKararlar(siteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const fetchKararlar = async (sid) => {
    try {
      setLoading(true);
      setError(null);

      const list = await getDataAsync(`ProjeYonetimKurulu/site/${sid}/kararlar`);
      const normalized = Array.isArray(list) ? list : list ? [list] : [];
      setKararlar(normalized);
    } catch (err) {
      console.error("KARAR LIST ERROR:", err);
      setError("Kararlar alınırken hata oluştu.");
      setKararlar([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenKarar = (token) => {
    if (!token) return;
    router.push(`/YonetimKurulu/karar/${token}`);
  };

  // ✅ Patron: düzenleme izni toggle
  const handleToggleDuzenleme = async (kararId, nextValue) => {
    try {
      // optimistic
      setKararlar((prev) =>
        prev.map((k) =>
          k.id === kararId ? { ...k, duzenlemeDurumu: nextValue } : k
        )
      );

      await postDataAsync("ProjeYonetimKurulu/karar/duzenleme-durumu", {
        kararId,
        duzenlemeDurumu: nextValue,
      });
    } catch (err) {
      console.error("DUZENLEME POST ERROR:", err);

      // rollback
      setKararlar((prev) =>
        prev.map((k) =>
          k.id === kararId ? { ...k, duzenlemeDurumu: !nextValue } : k
        )
      );

      alert("Düzenleme durumu güncellenemedi.");
    }
  };

  // Çıkış
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
    }
  };

  const formatTR = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const handleYeniKarar = () => router.push("/YonetimKurulu/yeni");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* =========================================================
          ✅ KURUMSAL LOGO HEADER (logo alanı her zaman açık)
         ========================================================= */}
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-10 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Logo box: dark mode olsa bile her zaman açık */}
            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:ring-zinc-200">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Yönetim Kurulu Karar Paneli
              </div>
            </div>
          </div>

          {/* Kurumsal açıklama alanı */}
          <div className="hidden max-w-xl items-center gap-2 md:flex">
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Yönetim kurulu kararları; şeffaflık, izlenebilirlik ve kurumsal
              düzen ilkeleri doğrultusunda bu panel üzerinden yönetilir.
            </span>

            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Onay süreçlerine uygun olarak oluşturulur ve kayıt altına alınır.
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-base font-semibold tracking-tight">
                  Bu Sayfa Sadece Yönetim Kurulu Üyeleri için düzenlenmiştir.
                </div>
                {isPatron && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                    Patron
                  </span>
                )}
              </div>

              <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                {personel
                  ? `${personel.ad ?? ""} ${personel.soyad ?? ""} `
                  : "Personel yükleniyor..."}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="h-7 rounded-md bg-red-600 px-1.5 text-[10px] font-semibold text-white hover:bg-red-700"
                >
                  Çıkış Yap
                </button>
                <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                  Proje
                </span>
                <div className="flex h-9 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  {sites.find((s) => String(s.siteId) === String(siteId))?.site
                    ?.ad ?? (siteId ? `Site #${siteId}` : "Seçiniz")}
                </div>
              </div>

              <button
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                onClick={() => siteId && fetchKararlar(siteId)}
                disabled={!siteId}
              >
                Yenile
              </button>

              <button
                className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={handleYeniKarar}
              >
                Yeni Karar Gir
              </button>
            </div>
          </div>

          {isPatron && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/15 dark:text-emerald-200">
              Patron mod aktif: Kartlarda “Düzenleme” anahtarını
              aç/kapatabilirsin.
            </div>
          )}
        </div>

        {/* States */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Yükleniyor...
          </div>
        )}

        {!loading && !error && kararlar.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Bu proje için karar bulunamadı.
          </div>
        )}

        {/* =========================================================
            ✅ KARARLAR 2 SÜTUN (wrapper grid)
            Not: KararCards "list" alıp kendi içinde map'liyorsa bile
            wrapper ile çoğu layout'ta 2 sütun görünüm elde edilir.
           ========================================================= */}
        {!loading && !error && kararlar.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              {/* Eğer KararCards tek bir container basıyorsa: */}
              <KararCards
                list={kararlar}
                isPatron={isPatron}
                formatTR={formatTR}
                onOpen={handleOpenKarar}
                onToggleDuzenleme={handleToggleDuzenleme}
              />
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}
