import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function getTodayInputValue() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatGun(tarih) {
  try {
    return new Date(tarih).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatHaftaGunu(tarih) {
  try {
    return new Date(tarih).toLocaleDateString("tr-TR", {
      weekday: "short",
    });
  } catch {
    return "";
  }
}

function buildFallbackSon14Gun() {
  const today = new Date();

  return Array.from({ length: 14 }).map((_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - index);

    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

    return {
      tarih: local.toISOString().slice(0, 10),
      raporVarMi: false,
    };
  });
}

function normalizeOtomatikMetin(value) {
  return String(value || "")
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\n");
}

function createBolumBaslik(title) {
  return `${title}
────────────────────`;
}

function Son14GunRaporDurumu({ personelId, seciliTarih, onTarihSec }) {
  const [items, setItems] = useState(buildFallbackSon14Gun());
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);

      if (!personelId) {
        setItems(buildFallbackSon14Gun());
        return;
      }

      const res = await getDataAsync(
        `idari-rapor/son-14-gun-durum?personelId=${personelId}`
      );

      const gelenItems = res?.items || res?.Items || [];

      if (!gelenItems.length) {
        setItems(buildFallbackSon14Gun());
        return;
      }

      setItems(
        gelenItems.map((x) => ({
          tarih: String(x.tarih ?? x.Tarih ?? "").slice(0, 10),
          raporVarMi: x.raporVarMi ?? x.RaporVarMi ?? false,
        }))
      );
    } catch (err) {
      console.error("Son 14 gün rapor durumu alınamadı:", err);
      setItems(buildFallbackSon14Gun());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [personelId]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold">Son 14 Gün</div>
          <div className="text-[10px] text-zinc-500">
            Tarihe dokun, raporu o güne hazırla
          </div>
        </div>

        {loading && (
          <span className="text-[10px] font-bold text-zinc-400">
            Yükleniyor...
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {items.map((item) => {
          const selected = String(seciliTarih) === String(item.tarih);

          return (
            <button
              key={item.tarih}
              type="button"
              onClick={() => onTarihSec?.(item.tarih)}
              className={`
                rounded-lg border px-1 py-1.5 text-center transition
                ${
                  item.raporVarMi
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500"
                }
                ${selected ? "ring-2 ring-blue-500 ring-offset-1" : ""}
              `}
            >
              <div className="text-[9px] font-bold capitalize leading-none">
                {formatHaftaGunu(item.tarih)}
              </div>

              <div className="mt-1 text-[11px] font-black leading-none">
                {formatGun(item.tarih)}
              </div>

              <div
                className={`mx-auto mt-1 h-2 w-2 rounded-full ${
                  item.raporVarMi ? "bg-emerald-500" : "bg-red-400"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function IdariRaporPage() {
  const [personel, setPersonel] = useState(null);
  const [tarih, setTarih] = useState(getTodayInputValue());

  const [teknik, setTeknik] = useState(false);
  const [havuz, setHavuz] = useState(false);
  const [peyzaj, setPeyzaj] = useState(false);

  const [otomatikMetin, setOtomatikMetin] = useState("");
  const [ekAciklama, setEkAciklama] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cookie = getClientCookie("PersonelUserInfo");

      if (!cookie) {
        setPersonel(null);
        return;
      }

      const parsed = JSON.parse(cookie);
      setPersonel(parsed);
    } catch (err) {
      console.error("PersonelUserInfo parse error:", err);
      setPersonel(null);
    }
  }, []);

  const personelId =
    personel?.id ||
    personel?.Id ||
    personel?.personel?.id ||
    personel?.personel?.Id;

  async function kaynakGetir({ baslik, teknikVal, havuzVal, peyzajVal }) {
    const qs = new URLSearchParams();
    qs.append("tarih", tarih);
    qs.append("teknik", teknikVal);
    qs.append("havuz", havuzVal);
    qs.append("peyzaj", peyzajVal);

    const res = await getDataAsync(`idari-rapor/kaynaklar?${qs.toString()}`);
    const metin = normalizeOtomatikMetin(res?.metin || "");

    if (!metin) return "";

    return `${createBolumBaslik(baslik)}
${metin}`;
  }

  async function islerimiGetir() {
    try {
      if (!tarih) {
        alert("Tarih seçmelisiniz.");
        return;
      }

      if (!teknik && !havuz && !peyzaj) {
        alert("En az bir iş türü seçmelisiniz.");
        return;
      }

      setLoading(true);

      const bolumler = [];

      if (havuz) {
        const havuzMetni = await kaynakGetir({
          baslik: "HAVUZ İŞLERİ",
          teknikVal: false,
          havuzVal: true,
          peyzajVal: false,
        });

        if (havuzMetni) bolumler.push(havuzMetni);
      }

      if (teknik) {
        const teknikMetni = await kaynakGetir({
          baslik: "TEKNİK İŞLER",
          teknikVal: true,
          havuzVal: false,
          peyzajVal: false,
        });

        if (teknikMetni) bolumler.push(teknikMetni);
      }

      if (peyzaj) {
        const peyzajMetni = await kaynakGetir({
          baslik: "PEYZAJ İŞLERİ",
          teknikVal: false,
          havuzVal: false,
          peyzajVal: true,
        });

        if (peyzajMetni) bolumler.push(peyzajMetni);
      }

      if (!bolumler.length) {
        setOtomatikMetin("");
        alert("Seçilen iş türleri için kayıt bulunamadı.");
        return;
      }

      setOtomatikMetin(bolumler.join("\n\n"));
    } catch (err) {
      console.error(err);
      alert("Veriler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  const nihaiRapor = useMemo(() => {
    const otomatik = otomatikMetin?.trim();
    const ek = ekAciklama?.trim();

    if (otomatik && ek) {
      return `${otomatik}

${createBolumBaslik("MÜDÜR ÖZEL NOTU")}
${ek}`;
    }

    if (otomatik) return otomatik;

    if (ek) {
      return `${createBolumBaslik("MÜDÜR ÖZEL NOTU")}
${ek}`;
    }

    return "";
  }, [otomatikMetin, ekAciklama]);

  async function kaydet() {
    try {
      if (!personelId) {
        alert("Personel bilgisi bulunamadı.");
        return;
      }

      if (!tarih) {
        alert("Lütfen takvimden rapor tarihi seçin.");
        return;
      }

      if (!nihaiRapor?.trim()) {
        alert("Kaydedilecek metin bulunamadı.");
        return;
      }

      setSaving(true);

      await postDataAsync("idari-rapor", {
        personelId: Number(personelId),
        tarih,
        aciklama: otomatikMetin,
        aciklama_2: ekAciklama,
        raporMetni: nihaiRapor,
        not_1: teknik ? "TEKNIK" : "",
        not_2: havuz ? "HAVUZ" : "",
        not_3: peyzaj ? "PEYZAJ" : "",
      });

      alert("Rapor başarıyla kaydedildi.");

      setTimeout(() => {
        window.location.reload();
      }, 750);
    } catch (err) {
      console.error(err);
      alert("Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTeknik(false);
    setHavuz(false);
    setPeyzaj(false);
    setOtomatikMetin("");
    setEkAciklama("");
    setTarih(getTodayInputValue());
  }

  function renderRaporMetni(text) {
    if (!text) {
      return (
        <div className="flex min-h-[170px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-2 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950">
          Tarih ve iş türü seçip “İşleri Getir” butonuna basın.
        </div>
      );
    }

    const lines = String(text || "").split("\n");

    return (
      <div className="min-h-[170px] rounded-lg border border-zinc-300 bg-zinc-50 p-2 text-xs leading-6 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
        {lines.map((rawLine, index) => {
          const line = rawLine.trim();

          if (!line) {
            return <div key={index} className="h-3" />;
          }

          const isBaslik =
            line === "HAVUZ İŞLERİ" ||
            line === "TEKNİK İŞLER" ||
            line === "PEYZAJ İŞLERİ" ||
            line === "MÜDÜR ÖZEL NOTU";

          if (isBaslik) {
            return (
              <div
                key={index}
                className="mt-2 mb-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-black tracking-wide text-zinc-800 first:mt-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {line}
              </div>
            );
          }

          if (line.includes("────")) {
            return null;
          }

          const projeMatch = line.match(/^(.+?)\s+projesinde\s+(.*)$/i);

          if (projeMatch) {
            return (
              <div key={index} className="mb-1 last:mb-0">
                <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[11px] font-bold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
                  {projeMatch[1].trim()}
                </span>{" "}
                <span>projesinde {projeMatch[2].trim()}</span>
              </div>
            );
          }

          return (
            <div key={index} className="mb-1 last:mb-0 whitespace-pre-wrap">
              {line}
            </div>
          );
        })}
      </div>
    );
  }

  const kategoriBase =
    "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold transition";

  return (
    <div className="min-h-screen bg-zinc-50 p-2 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-md space-y-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-base font-bold">İdari Rapor</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Günlük iş raporu oluştur
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-[11px] font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Sıfırla
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-2">
            <Son14GunRaporDurumu
              personelId={personelId}
              seciliTarih={tarih}
              onTarihSec={(date) => {
                setTarih(date);
                setOtomatikMetin("");
              }}
            />

            <div>
              <label className="mb-1 block text-[11px] font-bold text-zinc-500">
                İş Türü
              </label>

              <div className="flex gap-1.5">
                <label
                  className={`${kategoriBase} ${
                    teknik
                      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                      : "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={teknik}
                    onChange={(e) => setTeknik(e.target.checked)}
                    className="h-3 w-3"
                  />
                  Teknik
                </label>

                <label
                  className={`${kategoriBase} ${
                    havuz
                      ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-100"
                      : "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={havuz}
                    onChange={(e) => setHavuz(e.target.checked)}
                    className="h-3 w-3"
                  />
                  Havuz
                </label>

                <label
                  className={`${kategoriBase} ${
                    peyzaj
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
                      : "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={peyzaj}
                    onChange={(e) => setPeyzaj(e.target.checked)}
                    className="h-3 w-3"
                  />
                  Peyzaj
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={islerimiGetir}
              disabled={loading}
              className="h-9 w-full rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Getiriliyor..." : "İşleri Getir"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
            <div className="text-xs font-bold">Otomatik Metin</div>
          </div>

          <div className="p-2">
            <textarea
              rows={7}
              value={otomatikMetin}
              readOnly
              placeholder="İşleri Getir sonrası otomatik metin gelir."
              className="w-full resize-none rounded-lg border border-zinc-300 bg-zinc-50 p-2 text-xs leading-5 outline-none whitespace-pre-wrap dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
            <div className="text-xs font-bold">Müdür Özel Notu</div>
          </div>

          <div className="p-2">
            <textarea
              rows={5}
              value={ekAciklama}
              onChange={(e) => setEkAciklama(e.target.value)}
              placeholder="Müdür özel notunu giriniz..."
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-2 text-xs leading-5 outline-none focus:border-blue-500 whitespace-pre-wrap dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
            <div className="text-xs font-bold">Nihai Rapor</div>

            <div className="flex gap-1">
              {havuz && (
                <span className="rounded-md border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                  Havuz
                </span>
              )}

              {teknik && (
                <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                  Teknik
                </span>
              )}

              {peyzaj && (
                <span className="rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                  Peyzaj
                </span>
              )}
            </div>
          </div>

          <div className="p-2">{renderRaporMetni(nihaiRapor)}</div>
        </div>

        <button
          type="button"
          onClick={kaydet}
          disabled={saving}
          className="h-10 w-full rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Raporu Kaydet"}
        </button>
      </div>
    </div>
  );
}