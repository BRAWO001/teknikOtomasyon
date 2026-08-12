import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://localhost:7289/api";



function getSakinUserInfo() {
  const rawCookie = getClientCookie("SakinUserInfo");

  if (!rawCookie) return null;

  try {
    return JSON.parse(decodeURIComponent(rawCookie));
  } catch {
    try {
      return JSON.parse(rawCookie);
    } catch {
      return null;
    }
  }
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;

  return error?.message || "Destek talepleri alınamadı.";
}


function getStatusClasses(status) {
  const value = String(status || "")
    .toLocaleLowerCase("tr-TR");

  if (
    value.includes("tamam") ||
    value.includes("çözüldü") ||
    value.includes("sonuçlandı")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("iptal") ||
    value.includes("reddedildi")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function ActigimDestekTalepleriPage() {
  const router = useRouter();

  const [sakin, setSakin] = useState(null);
  const [talepler, setTalepler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const adSoyad = useMemo(() => {
    if (!sakin) return "";

    const gercekKisiAdi = [sakin.adi, sakin.soyadi]
      .filter(Boolean)
      .join(" ")
      .trim();

    return gercekKisiAdi || sakin.firmaAdi || "Sakin Kullanıcı";
  }, [sakin]);

  const talepleriGetir = async (telefon) => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!telefon?.trim()) {
        setTalepler([]);
        setErrorMessage(
          "Oturum cookie'sinde telefon bilgisi bulunamadı."
        );
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/AppProjeDestekTicket/benim-taleplerim`,
        {
          params: {
            telefon: telefon.trim(),
          },
          timeout: 15000,
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = response?.data;

      if (data?.success === false) {
        throw new Error(
          data?.message || "Destek talepleri alınamadı."
        );
      }

      setTalepler(
        Array.isArray(data?.items) ? data.items : []
      );
    } catch (error) {
      console.error(
        "Açtığım destek talepleri alınamadı:",
        error?.response?.data || error
      );

      setTalepler([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userInfo = getSakinUserInfo();

    if (!userInfo) {
      setLoading(false);
      setErrorMessage(
        "Sakin oturumu bulunamadı. Lütfen tekrar giriş yapınız."
      );
      return;
    }

    setSakin(userInfo);
    talepleriGetir(userInfo.telefon);
  }, []);

  const handleRefresh = () => {
    const userInfo = sakin || getSakinUserInfo();

    talepleriGetir(userInfo?.telefon);
  };

  const handleTicketDetail = (ticket) => {
    if (!ticket?.token) {
      setErrorMessage(
        "Bu destek talebi için detay token bilgisi bulunamadı."
      );
      return;
    }

    router.push(`/Destek/TalepDetay/${ticket.token}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            ← Geri
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Açtığım Destek Talepleri
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Oluşturduğunuz talepleri ve güncel durumlarını buradan takip edebilirsiniz.
              </p>

              {sakin && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">
                    {adSoyad}
                  </span>

                  <span className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700">
                    {sakin.telefon || "-"}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>
          </div>
        </header>

        {loading && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Destek talepleriniz yükleniyor...
            </p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => router.push("/sakinGiris")}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              Giriş Sayfasına Git
            </button>
          </div>
        )}

        {!loading &&
          !errorMessage &&
          talepler.length === 0 && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">📭</div>

              <h2 className="mt-4 text-lg font-black text-slate-800">
                Henüz destek talebiniz yok
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Oluşturduğunuz destek talepleri burada görüntülenecektir.
              </p>
            </div>
          )}

        {!loading &&
          !errorMessage &&
          talepler.length > 0 && (
            <div className="space-y-4">
              {talepler.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => handleTicketDetail(ticket)}
                  className="block w-full overflow-hidden rounded-3xl bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
                            Talep No: {ticket.ticketNo || ticket.id}
                          </span>

                          <span
                            className={`rounded-xl border px-3 py-1.5 text-xs font-black ${getStatusClasses(
                              ticket.durum
                            )}`}
                          >
                            {ticket.durum || "Devam Ediyor"}
                          </span>
                        </div>

                        <h2 className="mt-3 text-lg font-black text-slate-900">
                          {ticket.konu || "Destek Talebi"}
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-blue-600">
                          {ticket.departman || "-"}
                        </p>
                      </div>

                      <div className="text-xs font-semibold text-slate-500 sm:text-right">
                        {formatDate(ticket.tarihUtc)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs font-bold text-slate-400">
                          Blok
                        </div>

                        <div className="mt-1 text-sm font-black text-slate-800">
                          {ticket.blok || "-"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs font-bold text-slate-400">
                          Daire
                        </div>

                        <div className="mt-1 text-sm font-black text-slate-800">
                          {ticket.daire || "-"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs font-bold text-slate-400">
                          Site
                        </div>

                        <div className="mt-1 text-sm font-black text-slate-800">
                          {ticket.siteId || "-"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-800">
                        Açıklama
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {ticket.aciklama || "-"}
                      </p>
                    </div>

                    {ticket.yonetimNotu && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <h3 className="text-sm font-black text-blue-800">
                          Yönetim Notu
                        </h3>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-700">
                          {ticket.yonetimNotu}
                        </p>
                      </div>
                    )}

                    {ticket.ekBilgi && (
                      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                        <h3 className="text-sm font-black text-violet-800">
                          Ek Bilgi
                        </h3>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-violet-700">
                          {ticket.ekBilgi}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <span className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                        Talep Detayına Git →
                      </span>
                    </div>


                  </div>
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}