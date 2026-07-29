// src/pages/sakinGiris/sifremi-hatirla.jsx

import { useState } from "react";
import { useRouter } from "next/router";
import { postDataAsync } from "@/utils/apiService";

function extractMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;

  return error?.message || "İşlem sırasında bir hata oluştu.";
}

function normalizePhoneInput(value) {
  return String(value ?? "")
    .replace(/[^\d+]/g, "")
    .slice(0, 13);
}

export default function SifremiHatirlaPage() {
  const router = useRouter();

  const [telefon, setTelefon] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedPhone = telefon.trim();

    if (!trimmedPhone) {
      setIsError(true);
      setMessage("Telefon numaranızı giriniz.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setIsError(false);

      const response = await postDataAsync("AppMobil/sifremi-hatirla", {
        telefon: trimmedPhone,
      });

      setMessage(
        response?.message ||
          "Telefon numarası sistemde kayıtlıysa giriş şifreniz SMS ile gönderilecektir."
      );
    } catch (error) {
      console.error("ŞİFREMİ HATIRLA ERROR:", error);
      setIsError(true);
      setMessage(extractMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-200/70">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-6 py-8 text-white">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/20"
            >
              <span aria-hidden="true">←</span>
              Geri
            </button>

            <h1 className="text-2xl font-black">Şifremi Hatırla</h1>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              Sistemde kayıtlı telefon numaranızı girin. Giriş şifreniz SMS ile
              gönderilecektir.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label
                htmlFor="telefon"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Telefon numarası
              </label>

              <input
                id="telefon"
                name="telefon"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={telefon}
                onChange={(event) =>
                  setTelefon(normalizePhoneInput(event.target.value))
                }
                placeholder="05xx xxx xx xx"
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  isError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Gönderiliyor...
                </span>
              ) : (
                "Şifremi SMS ile gönder"
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/sakinGiris")}
              disabled={loading}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Giriş ekranına dön
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}