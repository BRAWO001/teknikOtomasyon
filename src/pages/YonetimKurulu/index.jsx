




// src/pages/YonetimKurulu/index.jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

import KararCards from "@/components/ProjeYonetimKurulu/KararCards";
import IletiCards from "@/components/ProjeYonetimKurulu/IletiCards";
import ProfilModals from "./Modals/ProfilModals";

const toArraySafe = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data];
};

export default function YonetimKuruluIndexPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");

  const [kararlar, setKararlar] = useState([]);
  const [iletis, setIletis] = useState([]);

  const [activeTab, setActiveTab] = useState("karar");
  const [loading, setLoading] = useState(false);
  const [siteLoading, setSiteLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profilOpen, setProfilOpen] = useState(false);

  const isPatron = useMemo(() => Number(personel?.rol) === 90, [personel]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cookie = getClientCookie("PersonelUserInfo");

      if (!cookie) {
        setPersonel(null);
        setSiteLoading(false);
        return;
      }

      const parsed = JSON.parse(cookie);
      const p = parsed?.personel ?? parsed;
      setPersonel(p ?? null);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      setPersonel(null);
      setSiteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!personel?.personelKodu) {
      setSiteLoading(false);
      return;
    }

    let cancelled = false;

    const loadSites = async () => {
      try {
        setSiteLoading(true);

        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/personel/${encodeURIComponent(
            personel.personelKodu
          )}`
        );

        if (cancelled) return;

        const normalized = toArraySafe(list).filter(Boolean);
        setSites(normalized);

        const firstSiteId = normalized?.[0]?.siteId ?? normalized?.[0]?.id;

        if (firstSiteId) {
          setSiteId((prev) => prev || String(firstSiteId));
        } else {
          setSiteId("");
          setKararlar([]);
          setIletis([]);
        }
      } catch (err) {
        console.error("SITE LIST ERROR:", err);
        if (cancelled) return;

        setSites([]);
        setSiteId("");
        setKararlar([]);
        setIletis([]);
      } finally {
        if (!cancelled) setSiteLoading(false);
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, [personel?.personelKodu]);

  useEffect(() => {
    if (!siteId) {
      setKararlar([]);
      setIletis([]);
      setLoading(false);
      return;
    }

    fetchAll(siteId);
  }, [siteId]);

  const fetchAll = async (sid) => {
    if (!sid) {
      setKararlar([]);
      setIletis([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [kararResult, iletiResult] = await Promise.allSettled([
        getDataAsync(`ProjeYonetimKurulu/site/${sid}/kararlar`),
        getDataAsync(`ProjeYonetimKurulu/ileti/site/${sid}/iletis`),
      ]);

      if (kararResult.status === "fulfilled") {
        setKararlar(toArraySafe(kararResult.value).filter(Boolean));
      } else {
        console.error("KARAR LIST ERROR:", kararResult.reason);
        setKararlar([]);
      }

      if (iletiResult.status === "fulfilled") {
        setIletis(toArraySafe(iletiResult.value).filter(Boolean));
      } else {
        console.error("ILETI LIST ERROR:", iletiResult.reason);
        setIletis([]);
      }

      if (
        kararResult.status === "rejected" &&
        iletiResult.status === "rejected"
      ) {
        setError(null);
      }
    } catch (err) {
      console.error("FETCH ALL ERROR:", err);
      setKararlar([]);
      setIletis([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (siteId) fetchAll(siteId);
  };

  const handleOpenKarar = (token) => {
    if (!token) return;
    router.push(`/YonetimKurulu/karar/${token}`);
  };

  const handleOpenIleti = (token) => {
    if (!token) return;
    router.push(`/YonetimKurulu/ileti/${token}`);
  };

  const handleToggleDuzenlemeKarar = async (kararId, nextValue) => {
    if (!kararId) return;

    try {
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
      console.error("KARAR DUZENLEME POST ERROR:", err);

      setKararlar((prev) =>
        prev.map((k) =>
          k.id === kararId ? { ...k, duzenlemeDurumu: !nextValue } : k
        )
      );

      alert("Düzenleme durumu güncellenemedi.");
    }
  };

  const handleToggleDuzenlemeIleti = async (iletiId, nextValue) => {
    if (!iletiId) return;

    try {
      setIletis((prev) =>
        prev.map((x) =>
          x.id === iletiId ? { ...x, duzenlemeDurumu: nextValue } : x
        )
      );

      await postDataAsync("ProjeYonetimKurulu/ileti/duzenleme-durumu", {
        iletiId,
        duzenlemeDurumu: nextValue,
      });
    } catch (err) {
      console.error("ILETI DUZENLEME POST ERROR:", err);

      setIletis((prev) =>
        prev.map((x) =>
          x.id === iletiId ? { ...x, duzenlemeDurumu: !nextValue } : x
        )
      );

      alert("Düzenleme durumu güncellenemedi.");
    }
  };

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
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "-";

      return date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const handleYeni = () => {
    if (activeTab === "ileti") {
      router.push("/YonetimKurulu/ileti/yeni");
      return;
    }

    router.push("/YonetimKurulu/yeni");
  };

  const selectedSiteName =
    sites.find((s) => String(s.siteId ?? s.id) === String(siteId))?.site?.ad ??
    sites.find((s) => String(s.siteId ?? s.id) === String(siteId))?.ad ??
    (siteId ? `Site #${siteId}` : "Site bulunamadı");

  const personelFullName = personel
    ? `${personel.ad ?? ""} ${personel.soyad ?? ""}`.trim()
    : "";

  const kararCount = kararlar.length;
  const iletiCount = iletis.length;
  const pageLoading = siteLoading || loading;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <ProfilModals
        open={profilOpen}
        onClose={() => setProfilOpen(false)}
        personelId={personel?.id ?? personel?.Id}
        personelFromCookie={personel}
        onLogout={handleLogout}
      />

      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-10 px-4 py-3">
          <div className="flex items-center gap-3">
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
                Yönetim Kurulu Paneli
              </div>
            </div>
          </div>

          <div className="hidden max-w-xl items-center gap-2 md:flex">
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Yönetim süreçleri; şeffaflık, izlenebilirlik ve kurumsal düzen
              ilkeleri doğrultusunda bu panel üzerinden yönetilir.
            </span>

            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Kayıt altına alınır ve arşivlenir.
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
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
                {personel ? personelFullName || "Personel" : "Personel bulunamadı"}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfilOpen(true)}
                  className="h-8 rounded-md bg-orange-600 px-3 text-[11px] font-semibold text-white hover:bg-orange-700"
                >
                  Profil Bilgileri
                </button>

                <button
                  onClick={handleLogout}
                  className="h-8 rounded-md bg-red-600 px-3 text-[11px] font-semibold text-white hover:bg-red-700"
                >
                  Çıkış Yap
                </button>

                {sites.length > 1 ? (
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="h-9 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                    title="Site seç"
                  >
                    {sites.map((s) => {
                      const value = String(s.siteId ?? s.id ?? "");
                      return (
                        <option key={value} value={value}>
                          {s.site?.ad ?? s.ad ?? `Site #${value}`}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="flex h-9 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    {selectedSiteName}
                  </div>
                )}
              </div>

              <button
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                onClick={handleRefresh}
                disabled={!siteId || pageLoading}
              >
                Yenile
              </button>

              <button
                className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={handleYeni}
                disabled={!siteId}
              >
                {activeTab === "ileti" ? "Yeni İleti Gir" : "Yeni Karar Gir"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("karar")}
              className={`h-9 rounded-md px-3 text-sm font-semibold shadow-sm transition ${
                activeTab === "karar"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              Kararlar{" "}
              <span className="ml-1 text-[12px] opacity-80">
                ({kararCount})
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ileti")}
              className={`h-9 rounded-md px-3 text-sm font-semibold shadow-sm transition ${
                activeTab === "ileti"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              İletiler{" "}
              <span className="ml-1 text-[12px] opacity-80">
                ({iletiCount})
              </span>
            </button>
          </div>

          {isPatron && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/15 dark:text-emerald-200">
              Patron mod aktif: Kartlarda “Düzenleme” anahtarını aç/kapatabilirsin.
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        {pageLoading && (
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Yükleniyor...
          </div>
        )}

        {!pageLoading && !siteId && (
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Bu kullanıcıya bağlı site bulunamadı.
          </div>
        )}

        {!pageLoading &&
          siteId &&
          activeTab === "karar" &&
          kararlar.length === 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Bu proje için karar bulunamadı.
            </div>
          )}

        {!pageLoading &&
          siteId &&
          activeTab === "karar" &&
          kararlar.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <KararCards
                  list={kararlar}
                  isPatron={isPatron}
                  formatTR={formatTR}
                  onOpen={handleOpenKarar}
                  onToggleDuzenleme={handleToggleDuzenlemeKarar}
                />
              </div>
            </div>
          )}

        {!pageLoading &&
          siteId &&
          activeTab === "ileti" &&
          iletis.length === 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Bu proje için ileti bulunamadı.
            </div>
          )}

        {!pageLoading &&
          siteId &&
          activeTab === "ileti" &&
          iletis.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <IletiCards
                  list={iletis}
                  isPatron={isPatron}
                  formatTR={formatTR}
                  onOpen={handleOpenIleti}
                  onToggleDuzenleme={handleToggleDuzenlemeIleti}
                />
              </div>
            </div>
          )}

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA,{" "}
          <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}