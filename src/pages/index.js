// pages/index.js
import { useState } from "react";
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

  const handleLogin = async () => {
    if (!tel || !sifre) {
      alert("Telefon ve şifre girin");
      return;
    }

    // ⛔️ Telefon 0 ile başlamıyorsa
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
    <div className="max-w-2xl h-full m-auto mt-2">
      <div className="relative flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-black p-4">
        <button
          onClick={() => router.push("/YeniPersonelKayit")}
          className="absolute top-4 right-4 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer transition-all duration-200"
        >
          Yeni Personel Kaydı
        </button>

        <div className="bg-gray-600 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center text-white mb-4">
            Giriş Yap
          </h2>

          <div className="flex flex-col gap-4">
            <input
              type="tel"
              placeholder="Telefon"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              placeholder="Şifre"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleLogin}
              className="mt-2 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-all duration-300 disabled:opacity-60 flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
