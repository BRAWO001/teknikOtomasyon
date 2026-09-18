import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/router";

import {
  getDataAsync,
} from "@/utils/apiService";

import AnketDosyaPanel from "@/components/AnketDosyaPanel";


export default function AnketDosyaYonetimi() {

  const router = useRouter();

  const [anketler, setAnketler] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedAnket, setSelectedAnket] =
    useState(null);


  const loadAnketler = async () => {
    try {
      setLoading(true);
      setError("");


      const query =
        search.trim()
          ? `?page=1&pageSize=100&search=${encodeURIComponent(
              search.trim()
            )}`
          : "?page=1&pageSize=100";


      const res =
        await getDataAsync(
          `anket/liste${query}`
        );


      const items =
        res?.items ??
        res?.Items ??
        [];


      setAnketler(
        Array.isArray(items)
          ? items
          : []
      );

    } catch (e) {
      console.error(
        "ANKET LIST ERROR:",
        e
      );

      setError(
        "Anket listesi alınamadı."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAnketler();
  }, []);


  const handleSearch = (e) => {
    e.preventDefault();

    loadAnketler();
  };


  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">

      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-zinc-200">

              <Image
                src="/eos_management_logo.png"
                alt="EOS Management"
                width={160}
                height={44}
                priority
                className="h-10 w-auto object-contain"
              />

            </div>


            <div>

              <div className="text-sm font-bold tracking-wide">
                EOS MANAGEMENT
              </div>

              <div className="text-xs text-zinc-500">
                Anket Dosya Yönetimi
              </div>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          >
            ← Geri
          </button>

        </div>
      </div>


      <div className="mx-auto max-w-7xl px-4 py-6">

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">


          {/* SOL - ANKETLER */}

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

            <div className="text-base font-semibold">
              Anketler
            </div>

            <div className="mt-1 text-[11px] text-zinc-500">
              Dosya eklemek istediğiniz
              anketi seçiniz.
            </div>


            <form
              onSubmit={handleSearch}
              className="mt-4 flex gap-2"
            >

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Anket ara..."
                className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />

              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Ara
              </button>

            </form>


            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {error}
              </div>
            )}


            <div className="mt-4 space-y-2">

              {loading ? (

                <div className="py-8 text-center text-sm text-zinc-500">
                  Anketler yükleniyor...
                </div>

              ) : anketler.length === 0 ? (

                <div className="py-8 text-center text-sm text-zinc-500">
                  Anket bulunamadı.
                </div>

              ) : (

                anketler.map((anket) => {

                  const id =
                    anket?.id ??
                    anket?.Id;

                  const baslik =
                    anket?.baslik ??
                    anket?.Baslik;

                  const siteAd =
                    anket?.siteAd ??
                    anket?.SiteAd;

                  const yayinlandi =
                    anket?.yayinlandiMi ??
                    anket?.YayinlandiMi;

                  const selected =
                    Number(
                      selectedAnket?.id ??
                      selectedAnket?.Id
                    ) === Number(id);


                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setSelectedAnket(
                          anket
                        )
                      }
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100 dark:bg-emerald-950/20"
                          : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                      }`}
                    >

                      <div className="text-sm font-semibold">
                        {baslik}
                      </div>

                      <div className="mt-1 text-[11px] text-zinc-500">
                        {siteAd || "-"}
                      </div>


                      <div className="mt-2 flex items-center gap-2">

                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] dark:border-zinc-700 dark:bg-zinc-900">
                          #{id}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] ${
                            yayinlandi
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {yayinlandi
                            ? "Yayında"
                            : "Yayında Değil"}
                        </span>

                      </div>

                    </button>
                  );
                })

              )}

            </div>
          </div>


          {/* SAĞ - DOSYA */}

          <div>

            {selectedAnket ? (

              <div className="space-y-4">

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

                  <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Seçili Anket
                  </div>

                  <div className="mt-1 text-lg font-semibold">
                    {selectedAnket?.baslik ??
                      selectedAnket?.Baslik}
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
                    {selectedAnket?.siteAd ??
                      selectedAnket?.SiteAd ??
                      "-"}
                  </div>

                </div>


                <AnketDosyaPanel
                  anketId={
                    selectedAnket?.id ??
                    selectedAnket?.Id
                  }
                />

              </div>

            ) : (

              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">

                <div className="text-base font-semibold">
                  Anket Seçilmedi
                </div>

                <div className="mt-2 text-sm text-zinc-500">
                  Sol taraftan dosya
                  eklemek istediğiniz
                  anketi seçiniz.
                </div>

              </div>

            )}

          </div>

        </div>

      </div>
    </div>
  );
}