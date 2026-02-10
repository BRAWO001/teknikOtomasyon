// src/pages/YonetimKurulu/karar/print/[token].jsx
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getCookie as getClientCookie } from "@/utils/cookieService";

export default function KararPdfDownloadPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const startedRef = useRef(false);

  const getAuthHeader = () => {
    try {
      const t = getClientCookie("Token") || getClientCookie("AccessToken");
      if (t) return { Authorization: `Bearer ${t}` };
    } catch {}
    return {};
  };

  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

  const downloadPdf = async (tkn) => {
    setLoading(true);
    setErr("");

    try {
      const url = `${apiBase}/api/YonetimKuruluPdfDonwload/karar/${encodeURIComponent(
        String(tkn)
      )}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt || ""}`.trim());
      }

      const cd = res.headers.get("content-disposition") || "";
      let filename = "karar.pdf";
      const m = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
      if (m) filename = decodeURIComponent(m[1] || m[2] || filename);

      const blob = await res.blob();
      const urlObj = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(urlObj);

      setLoading(false);

      setTimeout(() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }, 300);
    } catch (e) {
      console.error("PDF DOWNLOAD ERROR:", e);
      setErr("PDF indirilemedi. (Token / Yetki / Endpoint kontrol et)");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) return;
    if (startedRef.current) return;

    startedRef.current = true;
    downloadPdf(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, token]);

  return (
    <div className="min-h-screen bg-zinc-100 p-4">
      <div className="mx-auto max-w-xl rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-zinc-800">
          Karar PDF indiriliyor…
        </div>

        {loading ? (
          <div className="mt-2 text-[12px] text-zinc-600">
            Lütfen bekleyin, dosya hazırlanıyor.
          </div>
        ) : null}

        {!!err ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {err}
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => token && downloadPdf(token)}
            className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Tekrar indir
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/");
            }}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50"
          >
            Geri
          </button>
        </div>

        <div className="mt-3 text-[11px] text-zinc-500">
          Not: PDF indirme işi backend endpoint’inden gelir. Tarayıcı header/footer yok.
        </div>
      </div>
    </div>
  );
}
