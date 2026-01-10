




// pages/YeniPersonelKayit.jsx
import { useState } from "react";
import { useRouter } from "next/router";
import { checkAuthRedirect } from "@/utils/authRedirect";
import { postDataAsync } from "@/utils/apiService"; // ✅ axios yerine (token otomatik)

export async function getServerSideProps(context) {
  const redirect = await checkAuthRedirect(context);
  if (redirect) return redirect;

  return { props: {} };
}

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

      // ✅ token otomatik gider
      await postDataAsync("Personeller", payload);

      alert("Personel başarıyla oluşturuldu.");

      setAd("");
      setSoyad("");
      setTelefon("");
      setEposta("");
      setSifre("");
      setRol("");
      setAktifMi(true);
    } catch (err) {
      console.error(err?.response?.data || err?.message || err);

      alert(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Kayıt sırasında hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
      <div className="mx-auto flex min-h-screen w-2/4 max-w-3xl items-center justify-center p-4">
        {/* Kart */}
        <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          {/* ÜST BAR */}
          <div className="flex flex-col gap-3 border-b border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {/* ✅ Logo */}
              <div className="rounded-xl bg-white/10 p-2">
                <img
                  src="/eos_management_logo.png"
                  alt="EOS Management"
                  className="h-10 w-auto object-contain"
                />
              </div>

              <div className="flex flex-col">
                <p className="text-[11px] uppercase tracking-wide text-white/60">
                  EOS Management • Yönetim
                </p>
                <h1 className="text-lg font-semibold leading-tight">
                  Yeni Giriş Kaydı
                </h1>
                <p className="text-[12px] text-white/60">
                  Bilgilerinizi eksiksiz giriniz.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/15 active:scale-[0.99]"
              >
                ⬅ Geri
              </button>
            </div>
          </div>

          {/* FORM */}
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Grid alan */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Ad */}
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-white/70">
                    Ad <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                {/* Soyad */}
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-white/70">
                    Soyad <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={soyad}
                    onChange={(e) => setSoyad(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-white/70">
                    Telefon <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="05xx xxx xx xx"
                  />
                  <p className="mt-1 text-[11px] text-white/45">
                    Telefon numarası 0 ile başlamalıdır.
                  </p>
                </div>

                {/* E-posta */}
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-white/70">
                    E-posta <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={eposta}
                    onChange={(e) => setEposta(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                {/* Rol */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[12px] font-medium text-white/70">
                    Rol <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="" className="bg-zinc-900">
                      Seçiniz...
                    </option>
                    <option value="30" className="bg-zinc-900">
                      Teknik Personel
                    </option>
                    <option value="35" className="bg-zinc-900">
                      Merkez İdari Personeli
                    </option>
                    <option value="40" className="bg-zinc-900">
                      Proje Yöneticisi
                    </option>
                     <option value="40" className="bg-zinc-900">
                      Proje Yönetici Yardımcısı
                    </option>
                  </select>
                </div>

                {/* Şifre */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[12px] font-medium text-white/70 password"> 
                    Şifre <span className="text-rose-400">*</span>
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      required
                      type="password"
                      value={sifre}
                      onChange={(e) => setSifre(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                      placeholder="Örn: eos12345"
                    />

                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
                    >
                      Oto Üret
                    </button>
                  </div>

                  <p className="mt-1 text-[11px] text-white/45">
                    Öneri: Şifreyi personele güvenli kanaldan iletin.
                  </p>
                </div>
              </div>

              {/* Aktif mi */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Aktif mi?</span>
                  <span className="text-[11px] text-white/55">
                    Pasif personel sisteme giriş yapamaz.
                  </span>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    id="aktifMi"
                    type="checkbox"
                    checked={aktifMi}
                    onChange={(e) => setAktifMi(e.target.checked)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="text-[12px] text-white/70">
                    {aktifMi ? "Aktif" : "Pasif"}
                  </span>
                </label>
              </div>

              {/* Footer buton */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-white/45">
                  * İşaretli alanlar zorunludur.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.99]"
                >
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>

          {/* Alt imza */}
          <div className="border-t border-white/10 bg-black/20 px-4 py-3 text-center text-[12px] text-white/55">
            SAYGILARIMIZLA, <span className="font-semibold">EOS MANAGEMENT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
