// src/pages/sakinGiris/index.jsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { checkAuthRedirect } from "@/utils/authRedirect";

export async function getServerSideProps(context) {
  const redirect = await checkAuthRedirect(context);

  if (redirect) {
    return redirect;
  }

  return {
    props: {},
  };
}

export default function SakinLoginPage() {
  const router = useRouter();

  const [telefon, setTelefon] = useState("");
  const [sifre, setSifre] = useState("");
  const [loading, setLoading] = useState(false);

  const texts = [
    "Doğru planlama",
    "Şeffaf iletişim",
    "Disiplinli takip",
    "Kaliteli proje yönetimi",
  ];

  const [activeText, setActiveText] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveText((prev) => (prev + 1) % texts.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const telefonDuzenle = (value) => {
    let temizTelefon = value.replace(/\D/g, "");

    if (temizTelefon.length > 11) {
      temizTelefon = temizTelefon.slice(0, 11);
    }

    setTelefon(temizTelefon);
  };

  const handleLogin = async () => {
    const temizTelefon = telefon.replace(/\D/g, "");

    if (!temizTelefon || !sifre) {
      alert("Telefon ve şifre girin.");
      return;
    }

    if (!temizTelefon.startsWith("0")) {
      alert("Telefon numarası 0 ile başlamalı. Örn: 05xx xxx xx xx");
      return;
    }

    if (temizTelefon.length !== 11) {
      alert("Telefon numarası 11 haneli olmalıdır.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/sakinLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telefon: temizTelefon,
          sifre,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = {
          success: false,
          message: "Sunucudan geçersiz cevap alındı.",
        };
      }

      if (!response.ok || !data?.success) {
        alert(data?.message || "Giriş başarısız.");
        return;
      }

      /*
        sakinLogin.js içerisinde redirectUrl dönüyorsa onu kullanır.
        Dönmüyorsa sakin ana sayfasına yönlendirir.
      */
      const redirectUrl = data?.redirectUrl || "/sakinGiris/sakin";

      await router.replace(redirectUrl);
    } catch (error) {
      console.error("Sakin giriş hatası:", error);
      alert("Giriş yapılırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  const sifremiOgren = () => {
    router.push("/sakinGiris/sifremi-hatirla");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500" />

      <div className="mx-auto flex min-h-[calc(100vh-4px)] max-w-6xl items-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {/* SOL TARAF */}
          <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:min-h-[520px]">
            <div className="absolute inset-0 bg-blue-200/20 backdrop-blur-[1px]" />

            <div className="relative flex h-full min-h-[340px] flex-col justify-between p-7 md:min-h-[520px] md:p-10">
              <div>
                <div className="inline-flex rounded-2xl bg-white p-3 shadow-sm">
                  <img
                    src="/eos_management_logo.png"
                    className="h-20 w-auto object-contain md:h-24"
                    alt="EOS Management Logo"
                  />
                </div>
              </div>

              <div className="relative h-32">
                {texts.map((text, index) => (
                  <div
                    key={text}
                    className={`
                      absolute inset-0 flex items-center
                      text-2xl font-semibold tracking-wide text-blue-500
                      transition-all duration-700 md:text-3xl
                      ${
                        index === activeText
                          ? "translate-y-0 opacity-100"
                          : "translate-y-6 opacity-0"
                      }
                    `}
                  >
                    {text}
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* SAĞ TARAF */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl md:p-9">
            <div className="mb-6 flex flex-col items-center justify-center gap-2">
              <div className="text-[12px] font-semibold tracking-[0.25em] text-slate-500">
                SAKİN GİRİŞİ
              </div>

              
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="telefon"
                className="text-[12px] font-semibold text-slate-700"
              >
                Telefon
              </label>

              <input
                id="telefon"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="05xx xxx xx xx"
                value={telefon}
                maxLength={11}
                disabled={loading}
                onChange={(event) => telefonDuzenle(event.target.value)}
                onKeyDown={handleKeyDown}
                className="
                  h-11 rounded-2xl border border-slate-200
                  bg-slate-50 px-4 text-slate-900 outline-none
                  transition
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              />

              <label
                htmlFor="sifre"
                className="mt-2 text-[12px] font-semibold text-slate-700"
              >
                Şifre
              </label>

              <input
                id="sifre"
                type="password"
                autoComplete="current-password"
                placeholder="••••••"
                value={sifre}
                disabled={loading}
                onChange={(event) => setSifre(event.target.value)}
                onKeyDown={handleKeyDown}
                className="
                  h-11 rounded-2xl border border-slate-200
                  bg-slate-50 px-4 text-slate-900 outline-none
                  transition
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              />

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="
                  mt-4 h-11 rounded-2xl
                  bg-gradient-to-r from-blue-600 to-sky-500
                  font-semibold text-white
                  transition hover:brightness-110
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>

              {/* ŞİFREMİ ÖĞRENME YÖNLENDİRMESİ */}
              <button
                type="button"
                onClick={sifremiOgren}
                disabled={loading}
                className="
                  mt-1 rounded-xl px-3 py-2
                  text-sm font-medium text-blue-600
                  transition hover:bg-blue-50 hover:text-blue-700
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                Şifremi öğrenmek istiyorum
              </button>

             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}