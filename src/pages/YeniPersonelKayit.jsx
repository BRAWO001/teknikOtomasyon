// pages/YeniPersonelKayit.jsx
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { checkAuthRedirect } from "@/utils/authRedirect";

export async function getServerSideProps(context) {
  const redirect = await checkAuthRedirect(context);
  if (redirect) return redirect;

  return { props: {} };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pilotapisrc.com/api";

export default function YeniPersonelKayitPage() {
  const router = useRouter();

  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [rol, setRol] = useState("");
  const [aktifMi, setAktifMi] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleGeneratePassword = () => {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    setSifre(`eos${randomNumber}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ad.trim()) return alert("Ad zorunlu");
    if (!soyad.trim()) return alert("Soyad zorunlu");
    if (!telefon.trim()) return alert("Telefon zorunlu");

    // ⛔️ telefon 0 ile başlamıyorsa
    if (!telefon.startsWith("0")) {
      alert("Telefon numarası 0 ile başlamalı. Örn: 05xx xxx xx xx");
      return;
    }

    if (!eposta.trim()) return alert("E-posta zorunlu");
    if (!sifre.trim()) return alert("Şifre zorunlu");
    if (!rol) return alert("Rol seçmek zorunlu");

    setLoading(true);

    try {
      const payload = {
        ad: ad.trim(),
        soyad: soyad.trim(),
        telefon: telefon.trim(),
        eposta: eposta.trim(),
        sifre: sifre.trim(),
        aktifMi,
        rol: Number(rol),
      };

      await axios.post(`${API_BASE_URL}/Personeller`, payload);

      alert("Personel başarıyla oluşturuldu.");

      setAd("");
      setSoyad("");
      setTelefon("");
      setEposta("");
      setSifre("");
      setRol("");
      setAktifMi(true);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      alert(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Kayıt sırasında hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 relative">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute top-4 left-4 text-xs md:text-sm px-3 py-1 rounded-lg bg-gray-500 hover:bg-gray-600 text-white cursor-pointer"
        >
          ⬅ Geri
        </button>

        <h1 className="text-2xl md:3xl font-bold text-center text-white mb-6">
          Yeni Personel Kaydı
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-200 mb-1">Ad *</label>
            <input
              required
              type="text"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-500 text-white focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">
              Soyad *
            </label>
            <input
              required
              type="text"
              value={soyad}
              onChange={(e) => setSoyad(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-500 text-white focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">
              Telefon *
            </label>
            <input
              required
              type="tel"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-500 text-white focus:ring-2 focus:ring-emerald-400"
              placeholder="05xx xxx xx xx"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">
              E-posta *
            </label>
            <input
              required
              type="email"
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-500 text-white focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">
              Rol *
            </label>

            <select
              required
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-500 text-white focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">Seçiniz...</option>
              <option value="30">Teknik Personel</option>
              <option value="35">Merkez İdari Personeli</option>
              <option value="40">Proje Sorumlu Personeli</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">
              Şifre *
            </label>

            <div className="flex gap-2">
              <input
                required
                type="text"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white focus:ring-2 focus:ring-emerald-400"
                placeholder="Örn: eos12345"
              />

              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
              >
                Oto Üret
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              id="aktifMi"
              type="checkbox"
              checked={aktifMi}
              onChange={(e) => setAktifMi(e.target.checked)}
            />
            <label htmlFor="aktifMi" className="text-sm text-gray-200">
              Aktif mi?
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-xl"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
