import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { getDataAsync } from "@/utils/apiService";

function safeTrim(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : "";
}

/** TR telefon için basit normalize: boşluk/()/- temizler, +90/90 başını sadeleştirir */
function normalizeTelTR(input) {
  let s = safeTrim(input);
  if (!s) return "";

  // boşluk, parantez, tire vs kaldır
  s = s.replace(/[^\d+]/g, "");

  // +90 -> 0 ile başlat (isteğine göre değiştirebiliriz)
  if (s.startsWith("+90")) s = "0" + s.slice(3);
  else if (s.startsWith("90") && s.length >= 12) s = "0" + s.slice(2);

  // sadece rakam kalsın
  s = s.replace(/[^\d]/g, "");
  return s;
}

function normalizeEmail(input) {
  const s = safeTrim(input).toLowerCase();
  return s;
}

function isEmailLike(s) {
  // çok basic kontrol (a@b.c)
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Axios/Fetch hatasını tek yerden okunur hale getir */
function parseRequestError(err) {
  const status = err?.response?.status ?? err?.status ?? null;

  // backend bazen {message:"..."} bazen string döner
  const serverMsg =
    err?.response?.data?.message ||
    err?.response?.data?.Message ||
    (typeof err?.response?.data === "string" ? err.response.data : "") ||
    "";

  // axios network error gibi durumlarda response olmayabilir
  const rawMsg = serverMsg || err?.message || "İstek başarısız.";

  return { status, rawMsg };
}

export default function DestekGirisPage() {
  const router = useRouter();
  const reqSeq = useRef(0); // eski istek dönüşlerini yoksaymak için

  const [ticketNo, setTicketNo] = useState("");
  const [tel, setTel] = useState("");
  const [eposta, setEposta] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const normalizedTicketNo = useMemo(() => safeTrim(ticketNo), [ticketNo]);
  const normalizedTel = useMemo(() => normalizeTelTR(tel), [tel]);
  const normalizedEposta = useMemo(() => normalizeEmail(eposta), [eposta]);

  const validate = () => {
    const no = Number(normalizedTicketNo);

    if (!Number.isInteger(no) || no <= 0) return "Talep No (TicketNo) zorunlu.";
    if (!normalizedTel) return "Telefon zorunlu.";
    if (normalizedTel.length < 10) return "Telefon formatı geçersiz görünüyor.";
    if (!normalizedEposta) return "E-posta zorunlu.";
    if (!isEmailLike(normalizedEposta)) return "E-posta formatı geçersiz.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // double submit engel
    setMsg("");

    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    const mySeq = ++reqSeq.current;

    try {
      setLoading(true);

      const no = Number(normalizedTicketNo);

      // ✅ URL’i güvenli kur
      const qs = new URLSearchParams({
        ticketNo: String(no),
        tel: normalizedTel,
        eposta: normalizedEposta,
      }).toString();

      const res = await getDataAsync(`destek-talep-ticket/giris?${qs}`);

      // Bu sırada yeni bir submit olduysa eski response’u yoksay
      if (mySeq !== reqSeq.current) return;

      const token = res?.token ?? res?.Token ?? null;

      if (!token) {
        setMsg("Giriş başarılı ama token dönmedi. (Backend response kontrol edilmeli)");
        return;
      }

      // push da bazen hata verebilir; yakalayalım
      await router.push(`/Destek/TalepDetay/${encodeURIComponent(token)}`);
    } catch (err) {
  if (mySeq !== reqSeq.current) return;

  const { status, rawMsg } = parseRequestError(err);

  // ❌ console.error kaldırıyoruz
  // console.error("DESTEK GIRIS ERROR:", err);

  if (status === 401) {
    setMsg("Bilgiler hatalı.");
    return;
  }

  if (status === 404) {
    setMsg("Ticket bulunamadı.");
    return;
  }

  if (status === 422) {
    setMsg(rawMsg || "Girilen bilgiler doğrulanamadı.");
    return;
  }

  if (!status) {
    setMsg("Bağlantı hatası.");
    return;
  }

  setMsg(rawMsg || "Giriş yapılamadı.");
}finally {
      if (mySeq === reqSeq.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="relative h-14 w-48">
            <Image
              src="/eos_management_logo.png"
              alt="EOS Yönetim"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Talep Takip Girişi</h1>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Talep No + Telefon + E-posta ile talebinize ulaşabilirsiniz.
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Talep No (TicketNo)
            </div>
            <input
              inputMode="numeric"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              value={ticketNo}
              onChange={(e) => setTicketNo(e.target.value)}
              placeholder="Örn: 102345"
              disabled={loading}
            />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Telefon
              </div>
              <input
                inputMode="tel"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="05xx..."
                disabled={loading}
              />
              {/* küçük bilgi: normalize edilmiş hali */}
              {tel && normalizedTel ? (
                <div className="mt-1 text-[11px] text-zinc-500">
                  Gönderilecek: {normalizedTel}
                </div>
              ) : null}
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                E-posta
              </div>
              <input
                inputMode="email"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="ornek@mail.com"
                disabled={loading}
              />
            </label>
          </div>

          {msg ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {msg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Giriş yapılıyor..." : "Talebi Görüntüle"}
          </button>
        </form>
      </div>
    </div>
  );
}