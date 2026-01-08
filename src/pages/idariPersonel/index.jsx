// src/pages/idariPersonel/index.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

import IdariHeaderBar from "@/components/idariPersonel/IdariHeaderBar";
import IdariSatinAlmaIdSearch from "@/components/idariPersonel/IdariSatinAlmaIdSearch";
import TeknikIsEmirleriSection from "@/components/idariPersonel/TeknikIsEmirleriSection";
import IdariOnaylananFilterBar from "@/components/idariPersonel/IdariOnaylananFilterBar";
import IdariOnaylananGrid from "@/components/idariPersonel/IdariOnaylananGrid";

// Teknik iş emirleri backend path builder
function buildTeknikPath({ statusFilter, startDate, endDate, siteId, personelId }) {
  const qs = [];
  if (personelId) qs.push(`personelId=${encodeURIComponent(personelId)}`);
  if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);
  if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);

  const statusKey = statusFilter || "ALL";
  qs.push(`status=${encodeURIComponent(statusKey)}`);

  const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";
  return `personeller/teknikMudurFilterGet${queryString}`;
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export default function IdariPersonelListePage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  // İDARİ – tam onaylananlar
  const [tamOnaylananlar, setTamOnaylananlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // İDARİ filtreleri
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return toDateInputValue(d);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [siteId, setSiteId] = useState("");

  // Ortak site listesi
  const [sites, setSites] = useState([]);

  // ✅ SIRA NO (ID) İLE ARAMA — yeni
  const [idSearch, setIdSearch] = useState("");
  const [idLoading, setIdLoading] = useState(false);
  const [idError, setIdError] = useState(null);
  const [idResult, setIdResult] = useState(null);

  const handleIdSearch = async () => {
    const id = Number(idSearch);
    if (!id || id <= 0) {
      setIdError("Geçerli bir Sıra No (Id) giriniz.");
      setIdResult(null);
      return;
    }

    try {
      setIdLoading(true);
      setIdError(null);
      setIdResult(null);

      const dto = await getDataAsync(`satinalma/${id}`);
      setIdResult(dto || null);

      if (!dto) {
        setIdError("Bu Sıra No ile kayıt bulunamadı.");
      }
    } catch (err) {
      console.error("ID SEARCH ERROR:", err);
      setIdError("Bu Sıra No ile kayıt bulunamadı veya bir hata oluştu.");
      setIdResult(null);
    } finally {
      setIdLoading(false);
    }
  };

  const handleIdReset = () => {
    setIdSearch("");
    setIdLoading(false);
    setIdError(null);
    setIdResult(null);
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

  const handleYeniTalep = () => router.push("/idariPersonel/yeni");

  // Personel cookie
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      setPersonel(JSON.parse(cookie));
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
    }
  }, []);

  // Site listesi
  useEffect(() => {
    let cancelled = false;
    const loadSites = async () => {
      try {
        const res = await getDataAsync("SiteAptEvControllerSet/sites");
        if (cancelled) return;
        setSites(res || []);
      } catch (err) {
        console.error("SITES FETCH ERROR:", err);
      }
    };
    loadSites();
    return () => {
      cancelled = true;
    };
  }, []);

  // İDARİ – tam onaylananlar
  const fetchIdariTamOnaylananlar = async () => {
    try {
      setLoading(true);
      setError(null);

      const qs = [];
      if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);
      if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);
      const queryString = qs.length ? `?${qs.join("&")}` : "";

      const url = `satinalma/idariPersonelSatinAlmaGetir/onaylananlarTumOnaycilar${queryString}`;
      const fullApprovedData = await getDataAsync(url);

      setTamOnaylananlar(fullApprovedData || []);
    } catch (err) {
      console.error("IDARI KONTROL SATINALMA LIST ERROR:", err);
      setError(
        "İdari: Tüm onaycıları tarafından onaylanmış satın alma talepleri alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdariTamOnaylananlar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIdariApply = async () => fetchIdariTamOnaylananlar();

  const handleIdariReset = async () => {
    setStartDate("");
    setEndDate("");
    setSiteId("");
    await fetchIdariTamOnaylananlar();
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const pick = (obj, a, b) => obj?.[a] ?? obj?.[b];

  // ======================================================
  // TEKNİK İŞ EMİRLERİ: state + fetch
  // ======================================================
  const [teknikIsEmirleri, setTeknikIsEmirleri] = useState([]);
  const [teknikStatusFilter, setTeknikStatusFilter] = useState("ALL");
  const [teknikLoading, setTeknikLoading] = useState(false);
  const [teknikError, setTeknikError] = useState(null);

  const [teknikFilterPersonelId, setTeknikFilterPersonelId] = useState("");
  const [teknikFilterSiteId, setTeknikFilterSiteId] = useState("");
  const [teknikStartDate, setTeknikStartDate] = useState("");
  const [teknikEndDate, setTeknikEndDate] = useState("");

  const [teknikPersonelList, setTeknikPersonelList] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadPersonelList = async () => {
      try {
        const res = await getDataAsync("Personeller/ByDurum?rolKod=30&aktifMi=true");
        if (cancelled) return;
        setTeknikPersonelList(res || []);
      } catch (err) {
        console.error("PERSONELLER FETCH ERROR:", err);
      }
    };
    loadPersonelList();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchTeknikIsEmirleri = async (options = {}) => {
    try {
      setTeknikLoading(true);
      setTeknikError(null);

      const path = buildTeknikPath({
        statusFilter: options.statusFilter ?? teknikStatusFilter,
        startDate: options.startDate ?? teknikStartDate,
        endDate: options.endDate ?? teknikEndDate,
        siteId: options.siteId ?? teknikFilterSiteId,
        personelId: options.personelId ?? teknikFilterPersonelId,
      });

      const data = await getDataAsync(path);
      const list = Array.isArray(data) ? data : data ? [data] : [];
      setTeknikIsEmirleri(list);
    } catch (err) {
      console.error("İş emirleri yüklenirken hata:", err);
      setTeknikError(err.message || "Bilinmeyen bir hata oluştu.");
      setTeknikIsEmirleri([]);
    } finally {
      setTeknikLoading(false);
    }
  };

  useEffect(() => {
    fetchTeknikIsEmirleri({ statusFilter: teknikStatusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teknikStatusFilter]);

  useEffect(() => {
    fetchTeknikIsEmirleri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTeknikRefresh = async () => fetchTeknikIsEmirleri();
  const handleTeknikApply = async () => fetchTeknikIsEmirleri();

  const handleTeknikReset = async () => {
    setTeknikFilterPersonelId("");
    setTeknikFilterSiteId("");
    setTeknikStartDate("");
    setTeknikEndDate("");
    setTeknikStatusFilter("ALL");
  };

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <IdariHeaderBar
          personel={personel}
          totalCount={tamOnaylananlar.length}
          onGoHome={() => router.push("/")}
          onGoOnayiBekleyen={() => router.push("/idariPersonel/onayiBekleyenler")}
          onGoReddedilen={() => router.push("/idariPersonel/reddedilenler")}
          onYeniTalep={handleYeniTalep}
          onLogout={handleLogout}
        />

      

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Yükleniyor...
          </div>
        )}

        {!loading && tamOnaylananlar.length === 0 && !error && (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Filtrelere uygun, tüm onaylayıcıları tarafından onaylanmış idari talep bulunmuyor.
          </div>
        )}

        {/* TEKNİK BLOK */}
        <TeknikIsEmirleriSection
          sites={sites}
          teknikPersonelList={teknikPersonelList}
          teknikIsEmirleri={teknikIsEmirleri}
          teknikStatusFilter={teknikStatusFilter}
          setTeknikStatusFilter={setTeknikStatusFilter}
          teknikLoading={teknikLoading}
          teknikError={teknikError}
          teknikFilterPersonelId={teknikFilterPersonelId}
          setTeknikFilterPersonelId={setTeknikFilterPersonelId}
          teknikFilterSiteId={teknikFilterSiteId}
          setTeknikFilterSiteId={setTeknikFilterSiteId}
          teknikStartDate={teknikStartDate}
          setTeknikStartDate={setTeknikStartDate}
          teknikEndDate={teknikEndDate}
          setTeknikEndDate={setTeknikEndDate}
          onRefresh={handleTeknikRefresh}
          onApply={handleTeknikApply}
          onReset={handleTeknikReset}
        />

        {/* İDARİ FİLTRE + GRID */}
        <IdariOnaylananFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          siteId={siteId}
          setSiteId={setSiteId}
          sites={sites}
          loading={loading}
          onApply={handleIdariApply}
          onReset={handleIdariReset}
        />

        {!loading && !error && tamOnaylananlar.length > 0 && (
          <IdariOnaylananGrid list={tamOnaylananlar} formatDate={formatDate} />
        )}

          {/* ✅ YENİ: Satın Alma Sıra No ile Hızlı Arama */}
        <IdariSatinAlmaIdSearch
          idSearch={idSearch}
          setIdSearch={setIdSearch}
          idLoading={idLoading}
          idError={idError}
          idResult={idResult}
          onSearch={handleIdSearch}
          onReset={handleIdReset}
          formatDate={formatDate}
          pick={pick}
        />

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}
