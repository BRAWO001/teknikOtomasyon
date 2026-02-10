



// src/pages/YonetimKurulu/ileti/yeni.jsx
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function YonetimKuruluYeniIletiPage() {
  const router = useRouter();

  const [personel, setPersonel] = useState(null);

  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");

  const selectedSite = useMemo(
    () => sites.find((x) => String(x.siteId) === String(siteId)) || null,
    [sites, siteId]
  );

  const [uyeler, setUyeler] = useState([]);
  const [uyelerLoading, setUyelerLoading] = useState(false);
  const [uyelerError, setUyelerError] = useState(null);

  const [iletiKonusu, setIletiKonusu] = useState("");
  const [iletiAciklamasi, setIletiAciklamasi] = useState("");

  const [selectedPersonelIds, setSelectedPersonelIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cookie = getClientCookie("PersonelUserInfo");
      if (!cookie) return;
      const parsed = JSON.parse(cookie);
      const p = parsed?.personel ?? parsed;
      setPersonel(p ?? null);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      setPersonel(null);
    }
  }, []);

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
      } catch (e) {
        console.error("SITE LIST ERROR:", e);
        if (!cancelled) setSites([]);
      }
    };

    loadSites();
    return () => {
      cancelled = true;
    };
  }, [personel?.personelKodu]);

  useEffect(() => {
    if (!siteId) return;

    let cancelled = false;
    const loadUyeler = async () => {
      try {
        setUyelerLoading(true);
        setUyelerError(null);

        const list = await getDataAsync(
          `ProjeYonetimKurulu/site/${siteId}/uyeler`
        );
        if (cancelled) return;

        const normalized = Array.isArray(list) ? list : list ? [list] : [];
        setUyeler(normalized);

        setSelectedPersonelIds([]);
      } catch (e) {
        console.error("UYELER GET ERROR:", e);
        if (cancelled) return;
        setUyeler([]);
        setUyelerError("Üyeler alınamadı.");
      } finally {
        if (!cancelled) setUyelerLoading(false);
      }
    };

    loadUyeler();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const formatUye = (u) => {
    const p = u?.personel;
    if (!p) return `Personel #${u.personelId}`;
    return `${p.ad ?? ""} ${p.soyad ?? ""}`.trim();
  };

  const toggleSelect = (pid) => {
    const id = Number(pid);
    if (!id) return;

    setSelectedPersonelIds((prev) => {
      const has = prev.includes(id);
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const validate = () => {
    if (!siteId) return "Proje bilgisi bulunamadı.";
    if (!selectedSite?.site?.ad) return "Proje bulunamadı.";
    if (!selectedPersonelIds.length) return "En az 1 üye seçmelisiniz.";
    if (!iletiKonusu.trim()) return "İleti konusu zorunlu.";
    if (!iletiAciklamasi.trim()) return "İleti açıklaması zorunlu.";
    return null;
  };

  const extractBackendMsg = (err) => {
    const data = err?.response?.data;
    if (!data) return null;

    if (data?.errors && typeof data.errors === "object") {
      const flat = Object.entries(data.errors)
        .flatMap(([k, arr]) =>
          Array.isArray(arr) ? arr.map((x) => `${k}: ${x}`) : []
        )
        .slice(0, 8);
      if (flat.length) return flat.join(" | ");
    }

    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.title) return data.title;

    try {
      return JSON.stringify(data);
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    try {
      setSaving(true);
      setMsg(null);

      // ✅ BACKEND ALAN ADLARIYLA 1:1 UYUŞTURDUK
      const payload = {
        siteId: Number(siteId),
        iletiBaslik: iletiKonusu.trim(),
        iletiAciklama: iletiAciklamasi.trim(),
        katilanPersonelIdler: selectedPersonelIds,
        // opsiyonel:
        // durum: "Beklemede",
      };

      // ✅ DOĞRU ENDPOINT (controller route)
      const res = await postDataAsync("projeYonetimKurulu/ileti", payload);

      const token = res?.publicToken;
      if (token) {
        router.push(`/YonetimKurulu/ileti/${token}`);
        return;
      }

      router.push("/YonetimKurulu");
    } catch (e) {
      console.error("CREATE ILETI ERROR:", e);

      const backendMsg = extractBackendMsg(e);
      const status = e?.response?.status;

      // ✅ 401/403 ise “yetki” gerçekten odur.
      if (status === 401) {
        setMsg("Yetkisiz (401). Token/cookie gönderilmiyor veya oturum düşmüş.");
      } else if (status === 403) {
        setMsg("Erişim reddedildi (403). Bu role bu endpoint kapalı.");
      } else {
        setMsg(
          backendMsg
            ? `İleti oluşturulamadı: ${backendMsg}`
            : "İleti oluşturulamadı. (Endpoint/validasyon kontrol et)"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-5 px-4 py-3">
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
              <div className="text-sm font-bold tracking-wide">EOS MANAGEMENT</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Yönetim Kurulu • Yeni İleti Oluşturma
              </div>
            </div>
          </div>

          <div className="hidden max-w-xl items-center gap-2 md:flex">
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-1 text-[11px] font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              İletiler kurumsal kayıt niteliğindedir ve arşivlenir.
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Seçilen üyeler yorum/fikir bırakabilir.
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <button
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={() => router.push("/YonetimKurulu")}
          >
            ← Geri
          </button>

          <div className="text-right text-[12px] text-zinc-500 dark:text-zinc-400">
            {personel ? (
              <div className="font-medium text-zinc-700 dark:text-zinc-200">
                {personel.ad ?? ""} {personel.soyad ?? ""}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-tight">Yeni İleti</div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                İleti başlığı, açıklama ve ilgili üyeleri seçerek kayıt oluşturun.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {selectedSite?.site?.ad ?? "Proje"}
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Seçili Üye:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {selectedPersonelIds.length}
                </span>
              </span>
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              {msg}
            </div>
          )}

          <div className="mt-6">
            <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              Proje
            </label>
            <div className="flex h-10 w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
              {selectedSite?.site?.ad ?? "Site seçilmedi"}
            </div>
            <input type="hidden" name="siteId" value={siteId} />
          </div>

          <div className="mt-7">
            <div>
              <div className="text-sm font-semibold">İlgili Üyeler</div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Seçilen kişiler bu ileti için yorum/fikir bırakabilir.
              </div>
            </div>

            {uyelerLoading && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Üyeler yükleniyor...
              </div>
            )}

            {uyelerError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
                {uyelerError}
              </div>
            )}

            {!uyelerLoading && !uyelerError && uyeler.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {uyeler.map((u) => {
                  const pid = Number(u.personelId);
                  const checked = selectedPersonelIds.includes(pid);

                  return (
                    <label
                      key={u.id ?? `${u.personelId}`}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        checked
                          ? "border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-950"
                          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(pid)}
                        className="h-4 w-4"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {formatUye(u)}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          İlgili üye
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                İleti Başlığı
              </label>
              <input
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={iletiKonusu}
                onChange={(e) => setIletiKonusu(e.target.value)}
                placeholder="Örn: Temizlik hizmeti planı hakkında bilgilendirme"
                maxLength={250}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                İleti Açıklaması
              </label>
              <textarea
                className="min-h-[180px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                value={iletiAciklamasi}
                onChange={(e) => setIletiAciklamasi(e.target.value)}
                placeholder="Detayları yaz..."
                maxLength={4000}
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Kaydetmeden önce seçimleri kontrol ediniz.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/YonetimKurulu")}
                className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Vazgeç
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Kaydediliyor..." : "İletiyi Oluştur"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
        </div>
      </div>
    </div>
  );
}
