import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pilotapisrc.com/api";

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

function formatMoney(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;

  return (
    data?.detail ||
    data?.message ||
    error?.message ||
    "Borç bilgileri alınamadı."
  );
}

export default function BorclarimPage() {
  const router = useRouter();

  const [sakin, setSakin] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [openAccounts, setOpenAccounts] = useState({});

  const adSoyad = useMemo(() => {
    if (!sakin) return "";

    const gercekKisiAdi = [sakin.adi, sakin.soyadi]
      .filter(Boolean)
      .join(" ")
      .trim();

    return gercekKisiAdi || sakin.firmaAdi || "Sakin Kullanıcı";
  }, [sakin]);

  const bolumler = useMemo(() => {
    return Array.isArray(data?.bolumler) ? data.bolumler : [];
  }, [data]);

  const toplamHareket = useMemo(() => {
    return bolumler.reduce(
      (sum, item) =>
        sum +
        (Array.isArray(item?.hareketler)
          ? item.hareketler.length
          : 0),
      0
    );
  }, [bolumler]);

  const borclariGetir = async (telefon) => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!telefon?.trim()) {
        setData(null);
        setErrorMessage(
          "Oturum bilgilerinizde telefon numarası bulunamadı."
        );
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/SsmBorc/tum-borc-detaylari`,
        {
          GSM: telefon.trim(),
        },
        {
          timeout: 30000,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const result = response?.data;

      if (result?.success === false) {
        throw new Error(
          result?.message || "Borç bilgileri alınamadı."
        );
      }

      setData(result || null);

      const firstOpen = {};
      (result?.bolumler || []).forEach((item, index) => {
        firstOpen[`${item?.hesapID || index}`] = index === 0;
      });

      setOpenAccounts(firstOpen);
    } catch (error) {
      console.error(
        "SSM borç bilgileri alınamadı:",
        error?.response?.data || error
      );

      setData(null);
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
    borclariGetir(userInfo.telefon);
  }, []);

  const handleRefresh = () => {
    const userInfo = sakin || getSakinUserInfo();
    borclariGetir(userInfo?.telefon);
  };

  const toggleAccount = (key) => {
    setOpenAccounts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900 sm:px-4 sm:py-5">
      <div className="mx-auto w-full max-w-6xl">

        {/* ÜST ALAN */}
        <header className="mb-3 rounded-2xl bg-white px-4 py-4 shadow-sm sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-9 items-center rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >
              ← Geri
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex h-9 items-center rounded-xl bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Borçlarım
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Bağımsız bölümlerinize ait bakiye ve borç hareketlerini görüntüleyebilirsiniz.
            </p>

            {sakin && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                  {adSoyad}
                </span>

                <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                  {sakin.telefon || "-"}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Borç bilgileriniz getiriliyor...
            </p>
          </div>
        )}

        {/* HATA */}
        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 shadow-sm">
            <div className="text-sm font-black text-red-700">
              Bilgiler alınamadı
            </div>

            <p className="mt-1 text-xs leading-5 text-red-600">
              {errorMessage}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="h-9 rounded-xl bg-red-600 px-3 text-xs font-bold text-white"
              >
                Tekrar Dene
              </button>

              {!sakin && (
                <button
                  type="button"
                  onClick={() => router.push("/sakinGiris")}
                  className="h-9 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-700"
                >
                  Giriş Sayfası
                </button>
              )}
            </div>
          </div>
        )}

        {/* ÖZET */}
        {!loading && !errorMessage && data && (
          <>
            <section className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Toplam Bakiye
                </div>
                <div className="mt-1 text-base font-black text-red-600 sm:text-lg">
                  {formatMoney(data?.toplamBakiye)}
                </div>
              </div>

              <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Bölüm
                </div>
                <div className="mt-1 text-base font-black text-slate-800 sm:text-lg">
                  {data?.bolumSayisi ?? bolumler.length}
                </div>
              </div>

              <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Hareket
                </div>
                <div className="mt-1 text-base font-black text-slate-800 sm:text-lg">
                  {toplamHareket}
                </div>
              </div>

              <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Durum
                </div>
                <div className="mt-1 text-sm font-black text-slate-800">
                  {Number(data?.toplamBakiye || 0) > 0
                    ? "Borç Bulunuyor"
                    : "Borç Yok"}
                </div>
              </div>
            </section>

            {/* KAYIT YOK */}
            {bolumler.length === 0 && (
              <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm">
                <div className="text-3xl">✓</div>

                <h2 className="mt-2 text-base font-black text-slate-800">
                  Borç kaydı bulunamadı
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Telefon numaranıza bağlı açık bakiye görünmüyor.
                </p>
              </div>
            )}

            {/* HESAPLAR */}
            {bolumler.length > 0 && (
              <section className="space-y-3">
                {bolumler.map((bolum, index) => {
                  const key = `${bolum?.hesapID || index}`;
                  const isOpen = !!openAccounts[key];
                  const hareketler = Array.isArray(bolum?.hareketler)
                    ? bolum.hareketler
                    : [];

                  return (
                    <article
                      key={`${bolum?.hesapID}-${bolum?.bolumID}-${index}`}
                      className="overflow-hidden rounded-2xl bg-white shadow-sm"
                    >
                      {/* HESAP BAŞLIĞI */}
                      <button
                        type="button"
                        onClick={() => toggleAccount(key)}
                        className="block w-full px-4 py-4 text-left sm:px-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-slate-900 sm:text-base">
                              {bolum?.tesisAdi || "Tesis"}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                                {bolum?.blokNo || "-"} Blok
                              </span>

                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                                Daire {bolum?.bolumNo || "-"}
                              </span>

                              <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                                {hareketler.length} hareket
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Bakiye
                            </div>

                            <div className="mt-0.5 text-sm font-black text-red-600 sm:text-base">
                              {formatMoney(bolum?.bakiye)}
                            </div>

                            <div className="mt-1 text-xs font-black text-slate-400">
                              {isOpen ? "▲" : "▼"}
                            </div>
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100">
                          {/* KISA HESAP BİLGİLERİ */}
                          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
                            <div className="bg-white px-3 py-3">
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Ad Soyad
                              </div>
                              <div className="mt-1 truncate text-xs font-black text-slate-800">
                                {bolum?.adiSoyadi || "-"}
                              </div>
                            </div>

                            <div className="bg-white px-3 py-3">
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Tesis Kodu
                              </div>
                              <div className="mt-1 truncate text-xs font-black text-slate-800">
                                {bolum?.tesisKodu || "-"}
                              </div>
                            </div>

                            <div className="bg-white px-3 py-3">
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Hesap No
                              </div>
                              <div className="mt-1 truncate text-xs font-black text-slate-800">
                                {bolum?.hesapID || "-"}
                              </div>
                            </div>

                            <div className="bg-white px-3 py-3">
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Bölüm
                              </div>
                              <div className="mt-1 truncate text-xs font-black text-slate-800">
                                {bolum?.bolumNo || "-"}
                              </div>
                            </div>
                          </div>

                          {/* ÖDEME */}
                          {bolum?.odemeLink && (
                            <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
                              <a
                                href={bolum.odemeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-700 sm:ml-auto sm:w-auto"
                              >
                                Ödeme Sayfasına Git
                              </a>
                            </div>
                          )}

                          {/* HAREKETLER */}
                          <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
                            <div className="mb-2 flex items-center justify-between">
                              <h3 className="text-xs font-black text-slate-800">
                                Borç Hareketleri
                              </h3>

                              <span className="text-[11px] font-bold text-slate-400">
                                {hareketler.length} kayıt
                              </span>
                            </div>

                            {hareketler.length === 0 ? (
                              <div className="rounded-xl bg-slate-50 px-3 py-5 text-center text-xs font-semibold text-slate-500">
                                Bu hesap için açık hareket bulunamadı.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {hareketler.map((hareket, hareketIndex) => (
                                  <div
                                    key={`${hareket?.hesapID}-${hareketIndex}`}
                                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-black leading-5 text-slate-800">
                                          {hareket?.aciklama || "Borç hareketi"}
                                        </div>

                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                                          <span>
                                            Tarih: {formatDate(hareket?.tarih)}
                                          </span>

                                          <span>
                                            Vade: {formatDate(hareket?.vade)}
                                          </span>

                                          {hareket?.altHesapTuru && (
                                            <span>
                                              {hareket.altHesapTuru}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="shrink-0 text-right text-sm font-black text-red-600">
                                        {formatMoney(hareket?.bakiye)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
