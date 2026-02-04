




// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { checkAuthRedirect } from "@/utils/authRedirect";

export async function getServerSideProps(context) {
  const redirect = await checkAuthRedirect(context);
  if (redirect) return redirect;

  return { props: {} };
}

export default function LoginPage() {
  const router = useRouter();

  const [tel, setTel] = useState("");
  const [sifre, setSifre] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Dönen yazılar
  const texts = [
    "Teknik Personel",
    "Operasyon Yöneticisi",
    "Proje Yöneticisi",
    "Yönetim Kurulu Üyesi",
  ];

  const [activeText, setActiveText] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveText((p) => (p + 1) % texts.length);
    }, 1500);

    return () => clearInterval(t);
  }, []);

  const handleLogin = async () => {
    if (!tel || !sifre) {
      alert("Telefon ve şifre girin");
      return;
    }

    if (!tel.startsWith("0")) {
      alert("Telefon numarası 0 ile başlamalı. Örn: 05xx xxx xx xx");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tel, sifre }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Giriş başarısız");
        return;
      }

      router.push("/");
    } catch (error) {
      console.error("Login hata:", error);
      alert("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500" />

      <div className="mx-auto flex min-h-[calc(100vh-4px)] max-w-6xl items-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">

          {/* SOL TARAF – GÖRSEL + YAZI SLIDER */}
          <div className="relative overflow-hidden items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-2xl">

            

            {/* overlay */}
            <div className="absolute inset-0 bg-blue-200/20 backdrop-blur-[1px]" />

            <div className="relative p-10 flex flex-col h-full justify-between ">
              <div  >
                <div className="rounded-2xl bg-white p-3 ">
                  <img
                    src="/eos_management_logo.png"
                    className="h-24 "
                    alt="logo"
                  />
                </div>
              </div>

              {/* ✅ YAZI SLIDER */}
              <div className="h-32 relative">
                {texts.map((t, i) => (
                  <div
                    key={t}
                    className={`
                      absolute inset-0 flex items-center
                      text-3xl font-semibold text-blue-500 tracking-wide
                      transition-all duration-700
                      ${
                        i === activeText
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-6"
                      }
                    `}
                  >
                    {t}
                  </div>
                ))}
              </div>

              <div className="text-black/70 text-sm">
                EOS Management — Kurumsal Operasyon Platformu
              </div>
            </div>
          </div>

          {/* SAĞ TARAF – LOGIN */}
          <div className="rounded-3xl border border-slate-200 bg-white p-9 shadow-2xl">
            <div className="mb-6">
              <div className="text-[12px] font-semibold tracking-widest text-slate-500">
                GİRİŞ
              </div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                Hesabınıza giriş yapın
              </div>
              
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-semibold text-slate-700">
                Telefon
              </label>

              <input
                type="tel"
                placeholder="05xx xxx xx xx"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              />

              <label className="mt-2 text-[12px] font-semibold text-slate-700">
                Şifre
              </label>

              <input
                type="password"
                placeholder="••••••"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              />

              <button
                onClick={handleLogin}
                disabled={loading}
                className="mt-4 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold hover:brightness-110 transition disabled:opacity-60"
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>

              <div className="mt-4 text-center text-[12px] text-slate-500">
                 EOS Management
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
