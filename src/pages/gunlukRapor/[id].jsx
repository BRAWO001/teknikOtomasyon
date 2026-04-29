import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

function formatDateTR(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function normalizePersonel(raw) {
  if (!raw) return null;
  const p = raw?.personel ?? raw;

  return {
    id: pick(p, "id", "Id") ?? null,
    ad: pick(p, "ad", "Ad") ?? "",
    soyad: pick(p, "soyad", "Soyad") ?? "",
    rol: pick(p, "rol", "Rol", "rolKod", "RolKod") ?? null,
  };
}

function normalizeYorum(y) {
  if (!y) return null;
  return {
    id: pick(y, "id", "Id") ?? null,
    gunlukRaporId: pick(y, "gunlukRaporId", "GunlukRaporId") ?? null,
    personelId: pick(y, "personelId", "PersonelId") ?? null,
    personel: normalizePersonel(pick(y, "personel", "Personel")),
    yorum: pick(y, "yorum", "Yorum") ?? "",
    olusturmaTarihiUtc: pick(y, "olusturmaTarihiUtc", "OlusturmaTarihiUtc") ?? null,
  };
}

function normalizeDetay(x) {
  if (!x) return null;

  const konular = pick(x, "konular", "Konular");
  const talepler = pick(x, "talepOneriler", "TalepOneriler");
  const yoneticiler = pick(x, "yoneticiler", "Yoneticiler");
  const yorumlar = pick(x, "yorumlar", "Yorumlar");

  return {
    id: pick(x, "id", "Id") ?? null,
    personelId: pick(x, "personelId", "PersonelId") ?? null,
    tarih: pick(x, "tarih", "Tarih") ?? null,
    personelAdSoyad: pick(x, "personelAdSoyad", "PersonelAdSoyad") ?? "",
    gorevi: pick(x, "gorevi", "Gorevi") ?? "",
    bagliOlduguBirimProje:
      pick(x, "bagliOlduguBirimProje", "BagliOlduguBirimProje") ?? "",
    duzenlemeDurumu:
      typeof pick(x, "duzenlemeDurumu", "DuzenlemeDurumu") === "boolean"
        ? pick(x, "duzenlemeDurumu", "DuzenlemeDurumu")
        : false,

    konular: Array.isArray(konular)
      ? konular.map((k) => ({
          id: pick(k, "id", "Id") ?? null,
          konu: pick(k, "gunlukRaporKonu", "GunlukRaporKonu") ?? "",
          aciklama:
            pick(k, "gunlukRaporKonuAciklama", "GunlukRaporKonuAciklama") ?? "",
        }))
      : [],

    talepOneriler: Array.isArray(talepler)
      ? talepler.map((t) => ({
          id: pick(t, "id", "Id") ?? null,
          konu:
            pick(
              t,
              "gunlukRaporTalepOneriKonu",
              "GunlukRaporTalepOneriKonu"
            ) ?? "",
          aciklama:
            pick(
              t,
              "gunlukRaporTalepOneriKonuAciklama",
              "GunlukRaporTalepOneriKonuAciklama"
            ) ?? "",
        }))
      : [],

    yoneticiler: Array.isArray(yoneticiler)
      ? yoneticiler.map((y) => ({
          id: pick(y, "id", "Id") ?? null,
          secilenYoneticiId:
            pick(y, "secilenYoneticiId", "SecilenYoneticiId") ?? null,
          secilenYonetici: normalizePersonel(
            pick(y, "secilenYonetici", "SecilenYonetici")
          ),
        }))
      : [],

    yorumlar: Array.isArray(yorumlar)
      ? yorumlar.map(normalizeYorum).filter(Boolean)
      : [],
  };
}

function SoftCard({ title, right, children }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function GunlukRaporDetayPage() {
  const router = useRouter();
  const { id } = router.query;

  const [personel, setPersonel] = useState(null);
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [yorum, setYorum] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    const raw = getClientCookie("PersonelUserInfo");
    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const p = normalizePersonel(parsed);
      if (!p?.id) {
        router.push("/");
        return;
      }
      setPersonel(p);
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      router.push("/");
    }
  }, [router]);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setErr("");

      const res = await getDataAsync(`gunlukRapor/${id}`);
      setData(normalizeDetay(res));
    } catch (e) {
      console.error("DETAY ERROR:", e);
      setData(null);
      const status = e?.response?.status;
      setErr(status ? `Detay alınamadı (HTTP ${status}).` : "Detay alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, loadData]);

  const canComment = useMemo(() => {
    return !!personel?.id && !!data?.duzenlemeDurumu;
  }, [personel?.id, data?.duzenlemeDurumu]);

  const handleYorumEkle = async () => {
    if (!data?.id || !personel?.id) return;

    if (!canComment) {
      setSaveMsg("Yorum gönderme kapalı.");
      return;
    }

    const temiz = (yorum || "").trim();
    if (!temiz) {
      setSaveMsg("Lütfen yorum yazınız.");
      return;
    }

    try {
      setSaving(true);
      setSaveMsg("");

      const payload = {
        gunlukRaporId: Number(data.id),
        personelId: Number(personel.id),
        yorum: temiz,
      };

      const res = await postDataAsync("gunlukRapor/yorum", payload);

      const yeniYorum = {
        id: res?.id ?? Math.floor(Math.random() * 1000000000),
        gunlukRaporId: Number(data.id),
        personelId: Number(personel.id),
        personel: {
          id: Number(personel.id),
          ad: personel.ad,
          soyad: personel.soyad,
          rol: personel.rol,
        },
        yorum: temiz,
        olusturmaTarihiUtc: new Date().toISOString(),
      };

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          yorumlar: [yeniYorum, ...(prev.yorumlar || [])],
        };
      });

      setYorum("");
      setSaveMsg("Yorum gönderildi.");
    } catch (e) {
      console.error("YORUM ERROR:", e);
      const status = e?.response?.status;
      setSaveMsg(
        status ? `Yorum eklenemedi (HTTP ${status}).` : "Yorum eklenemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-[13px] text-zinc-600 dark:text-zinc-300">
        Yükleniyor...
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {err || "Kayıt bulunamadı."}
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-3 rounded-md bg-zinc-900 px-4 py-2 text-[12px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Günlük Rapor Detayı
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Rapor No: #{data.id}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Ana Sayfaya Dön
          </button>

          <button
            type="button"
            onClick={loadData}
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-3">
          <SoftCard title="Genel Bilgiler">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-[11px] text-zinc-500">Tarih</div>
                <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatDateTR(data.tarih)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">Personel</div>
                <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                  {safeText(data.personelAdSoyad)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">Görev</div>
                <div className="text-[13px] text-zinc-700 dark:text-zinc-200">
                  {safeText(data.gorevi)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">Birim / Proje</div>
                <div className="text-[13px] text-zinc-700 dark:text-zinc-200">
                  {safeText(data.bagliOlduguBirimProje)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-zinc-500">Düzenleme Durumu</div>
                <div className="text-[13px] font-semibold">
                  {data.duzenlemeDurumu ? (
                    <span className="text-emerald-600">Açık</span>
                  ) : (
                    <span className="text-red-600">Kapalı</span>
                  )}
                </div>
              </div>
            </div>
          </SoftCard>

          <SoftCard
            title="Günlük Rapor Konuları"
            right={
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {data.konular.length} kayıt
              </span>
            }
          >
            <div className="space-y-3">
              {data.konular.length ? (
                data.konular.map((k, i) => (
                  <div
                    key={k.id ?? i}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                      {safeText(k.konu)}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-[12px] text-zinc-700 dark:text-zinc-200">
                      {safeText(k.aciklama)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                  Kayıt yok.
                </div>
              )}
            </div>
          </SoftCard>

          <SoftCard
            title="Talep / Öneriler"
            right={
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {data.talepOneriler.length} kayıt
              </span>
            }
          >
            <div className="space-y-3">
              {data.talepOneriler.length ? (
                data.talepOneriler.map((t, i) => (
                  <div
                    key={t.id ?? i}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                      {safeText(t.konu)}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-[12px] text-zinc-700 dark:text-zinc-200">
                      {safeText(t.aciklama)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                  Kayıt yok.
                </div>
              )}
            </div>
          </SoftCard>

          <SoftCard
            title="Yorum Ekle"
            right={
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {data.duzenlemeDurumu ? "Açık" : "Kapalı"}
              </span>
            }
          >
            <textarea
              value={yorum}
              onChange={(e) => setYorum(e.target.value)}
              disabled={!canComment || saving}
              rows={4}
              placeholder={
                canComment ? "Yorumunuzu yazın..." : "Yorum gönderme kapalı"
              }
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleYorumEkle}
                disabled={!canComment || saving}
                className="h-10 rounded-md bg-zinc-900 px-4 text-[12px] font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {saving ? "Gönderiliyor..." : "Yorum Gönder"}
              </button>

              <div className="text-[12px] text-zinc-600 dark:text-zinc-300">
                {saveMsg}
              </div>
            </div>
          </SoftCard>

          <SoftCard
            title="Yorumlar"
            right={
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {data.yorumlar.length} kayıt
              </span>
            }
          >
            {data.yorumlar.length ? (
              <div className="space-y-3">
                {data.yorumlar.map((y) => (
                  <div
                    key={y.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                          {safeText(y.personel?.ad)} {safeText(y.personel?.soyad)}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap break-words text-[12px] text-zinc-700 dark:text-zinc-200">
                          {safeText(y.yorum)}
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatDateTR(y.olusturmaTarihiUtc)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                Henüz yorum yok.
              </div>
            )}
          </SoftCard>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <SoftCard
            title="Seçilen Yöneticiler"
            right={
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {data.yoneticiler.length} kişi
              </span>
            }
          >
            {data.yoneticiler.length ? (
              <div className="space-y-2">
                {data.yoneticiler.map((y, i) => (
                  <div
                    key={y.id ?? i}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                      {safeText(y.secilenYonetici?.ad)}{" "}
                      {safeText(y.secilenYonetici?.soyad)}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Rol: {safeText(y.secilenYonetici?.rol)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                Yönetici yok.
              </div>
            )}
          </SoftCard>
        </div>
      </div>
    </div>
  );
}