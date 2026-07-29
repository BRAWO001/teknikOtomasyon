import Image from "next/image";
import { useRouter } from "next/router";

const HESAPLAR_PORTAL_URL = "https://portal.eosyonetim.com.tr";

export default function HesaplarPage() {
  const router = useRouter();

  const handlePortalRedirect = () => {
    window.location.href = HESAPLAR_PORTAL_URL;
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="shrink-0 text-sm font-bold text-blue-600 transition hover:text-blue-700"
            >
              ← Geri
            </button>

            <div className="flex min-w-0 flex-1 justify-end">
              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={180}
                height={60}
                priority
                className="h-12 w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl">
            ₺
          </div>

          <h2 className="mt-5 text-xl font-black text-slate-900">
            Hesaplar Platformuna Geçiş
          </h2>

          <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-semibold leading-6 text-amber-800">
              Hesaplarınız ve ödemeleriniz ile ilgili giriş yapacağınız
              platformda kullanmış olduğunuz şifre, bu platformda kullandığınız
              şifreden farklı olabilir.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePortalRedirect}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Hesaplar Platformuna Git →
          </button>

          <p className="mt-4 break-all text-xs font-semibold text-slate-400">
            portal.eosyonetim.com.tr
          </p>
        </section>
      </div>
    </div>
  );
}