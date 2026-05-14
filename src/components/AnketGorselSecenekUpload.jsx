import { useRef, useState } from "react";
import { postDataAsync } from "../utils/apiService";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const ANKET_DOSYA_URL_POST = "anket/secenek-dosya-url";

function isImageFile(file) {
  if (!file) return false;
  return (
    file.type?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name || "")
  );
}

export default function AnketGorselSecenekUpload({
  onUrlReady,
  buttonText = "Görsel Yükle ve Seçenek Yap",
}) {
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [lastUrl, setLastUrl] = useState("");

  const handlePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    setError("");
    setLastUrl("");

    if (!file) return;

    if (!isImageFile(file)) {
      setError("Lütfen sadece görsel seçin. jpg, png, webp, gif");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await postDataAsync(UPLOAD_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = uploadRes?.Url || uploadRes?.url;

      if (!url) {
        throw new Error("Upload cevabında Url alanı bulunamadı.");
      }

      const saveRes = await postDataAsync(
        ANKET_DOSYA_URL_POST,
        {
          url,
          dosyaAdi: file.name,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const finalUrl = saveRes?.secenekMetni || saveRes?.url || url;

      setLastUrl(finalUrl);

      onUrlReady?.({
        url: finalUrl,
        secenekMetni: finalUrl,
        dosyaAdi: file.name,
      });
    } catch (err) {
      console.error("Anket görsel seçenek upload hata:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Görsel yüklenirken hata oluştu."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePick}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-zinc-700 dark:text-zinc-200">
            Görsel Seçenek Yükleme
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Yüklenen görsel URL olarak seçenek metnine eklenecek.
          </div>
        </div>

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Yükleniyor..." : buttonText}
        </button>
      </div>

      {previewUrl && (
        <div className="mt-3">
          <img
            src={previewUrl}
            alt="Görsel önizleme"
            className="h-28 w-28 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
          />
        </div>
      )}

      {lastUrl && (
        <div className="mt-2 break-all rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800">
          URL hazır: {lastUrl}
        </div>
      )}

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}