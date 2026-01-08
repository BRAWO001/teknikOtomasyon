




import { useEffect, useState } from "react";
import { getDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

import SatinalmaTopBar from "@/components/satinalma/SatinalmaTopBar";
import SatinalmaIdSearch from "@/components/satinalma/SatinalmaIdSearch";
import SatinalmaGenelArama from "@/components/satinalma/SatinalmaGenelArama";
import SatinalmaOnayliFiltre from "@/components/satinalma/SatinalmaOnayliFiltre";
import SatinalmaKartGrid from "@/components/satinalma/SatinalmaKartGrid";
import SatinalmaListStateBox from "@/components/satinalma/SatinalmaListStateBox";

export default function SatinAlmaListePage() {
  const [personel, setPersonel] = useState(null);

  // ✅ Tüm onaylananlar (mevcut liste)
  const [tamOnaylananlar, setTamOnaylananlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Mevcut filtreler (tam onaylananlar için)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sites, setSites] = useState([]);

  // ✅ 1) Sıra No arama
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

  // ✅ 2) Genel arama (sayfa açılınca GET yok)
  const [genelStartDate, setGenelStartDate] = useState("");
  const [genelEndDate, setGenelEndDate] = useState("");
  const [genelSiteId, setGenelSiteId] = useState("");
  const [genelList, setGenelList] = useState([]);
  const [genelLoading, setGenelLoading] = useState(false);
  const [genelError, setGenelError] = useState(null);
  const [genelTouched, setGenelTouched] = useState(false);

  const fetchGenel = async () => {
    try {
      setGenelLoading(true);
      setGenelError(null);

      const qs = [];
      if (genelStartDate) qs.push(`startDate=${encodeURIComponent(genelStartDate)}`);
      if (genelEndDate) qs.push(`endDate=${encodeURIComponent(genelEndDate)}`);
      if (genelSiteId) qs.push(`siteId=${encodeURIComponent(genelSiteId)}`);

      const queryString = qs.length ? `?${qs.join("&")}` : "";
      const url = `satinalma/hepsi${queryString}`;

      const res = await getDataAsync(url);
      setGenelList(res || []);
    } catch (err) {
      console.error("GENEL LIST ERROR:", err);
      setGenelError("Genel arama sonuçları alınırken bir hata oluştu.");
      setGenelList([]);
    } finally {
      setGenelLoading(false);
    }
  };

  const handleGenelApply = async () => {
    setGenelTouched(true);
    await fetchGenel();
  };

  const handleGenelReset = () => {
    setGenelTouched(false);
    setGenelStartDate("");
    setGenelEndDate("");
    setGenelSiteId("");
    setGenelList([]);
    setGenelError(null);
    setGenelLoading(false);
  };

  // ------------------------------------------------------
  // Personel cookie'sini oku
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // Site listesini çek
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // Tam onaylananlar listesi (sayfa açılınca çalışsın)
  // ------------------------------------------------------
  const fetchKontrolTalepler = async () => {
    try {
      setLoading(true);
      setError(null);

      const qs = [];
      if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);
      if (siteId) qs.push(`siteId=${encodeURIComponent(siteId)}`);

      const queryString = qs.length > 0 ? `?${qs.join("&")}` : "";
      const url = `satinalma/KontrolSatınAlmaTalepleri${queryString}`;

      const data = await getDataAsync(url);
      setTamOnaylananlar(data || []);
    } catch (err) {
      console.error("KONTROL SATINALMA LIST ERROR:", err);
      setError("Tamamı onaylanmış satın alma talepleri alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKontrolTalepler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterApply = async () => {
    await fetchKontrolTalepler();
  };

  const handleFilterReset = async () => {
    setStartDate("");
    setEndDate("");
    setSiteId("");
    await fetchKontrolTalepler();
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <SatinalmaTopBar totalCount={tamOnaylananlar.length} />

        <SatinalmaIdSearch
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

        <SatinalmaGenelArama
          genelStartDate={genelStartDate}
          setGenelStartDate={setGenelStartDate}
          genelEndDate={genelEndDate}
          setGenelEndDate={setGenelEndDate}
          genelSiteId={genelSiteId}
          setGenelSiteId={setGenelSiteId}
          sites={sites}
          onApply={handleGenelApply}
          onReset={handleGenelReset}
          genelTouched={genelTouched}
          genelLoading={genelLoading}
          genelError={genelError}
          genelList={genelList}
          formatDate={formatDate}
        />

        <SatinalmaOnayliFiltre
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          siteId={siteId}
          setSiteId={setSiteId}
          sites={sites}
          loading={loading}
          onApply={handleFilterApply}
          onReset={handleFilterReset}
        />

        {error && <SatinalmaListStateBox type="error">{error}</SatinalmaListStateBox>}

        {loading && <SatinalmaListStateBox type="info">Yükleniyor...</SatinalmaListStateBox>}

        {!loading && tamOnaylananlar.length === 0 && !error && (
          <SatinalmaListStateBox type="info">
            Filtrelere uygun, tüm onaylayıcıları tarafından onaylanmış talep bulunmuyor.
          </SatinalmaListStateBox>
        )}

        {!loading && !error && tamOnaylananlar.length > 0 && (
          <section className="mt-4">
            <SatinalmaKartGrid
              list={tamOnaylananlar}
              theme="emerald"
              formatDate={formatDate}
            />
          </section>
        )}
      </div>
    </div>
  );
}
