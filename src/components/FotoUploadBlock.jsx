// src/components/FotoUploadBlock.jsx

import { useState } from "react";

/**
 * Görseli yeniden boyutlandırıp JPEG olarak sıkıştırır.
 * - quality: 0–1 arası (0.75 = %75 kalite)
 * - maxWidth / maxHeight: dev fotolarda maksimum çözünürlük sınırı
 */
async function compressImageFile(
  file,
  quality = 0.75,
  maxWidth = 1920,
  maxHeight = 1920
) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Oran koruyarak yeniden boyutlandırma
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio, 1); // 1'den küçükse küçült, değilse bırak

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Görsel sıkıştırılamadı."));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = (err) => reject(err);

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function FotoUploadBlock({ uploadAndAttach }) {
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState("");

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setPhotoUrl("");

    try {
      setPhotoUploading(true);

      // 1) Dev fotolarda çözünürlüğü max 1920x1920'a, hepsinde kaliteyi %75'e düşür
      const compressedFile = await compressImageFile(file, 0.75, 1920, 1920);

      // Geçici önizleme için:
      setPhotoPreview(URL.createObjectURL(compressedFile));

      // 2) Sunucuya gönder + iş emrine bağla
      const url = await uploadAndAttach(compressedFile, 10);

      setPhotoUrl(url);
      // istersen direkt URL kullan:
      setPhotoPreview(url);
    } catch (err) {
      console.error("Foto upload hata:", err);
      setPhotoError(
        err?.response?.data?.Message ||
          err?.message ||
          "Fotoğraf yüklenirken bir hata oluştu."
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Fotoğraf
      </div>

      {/* Önizleme */}
      <div className="mb-2 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview}
            alt="Foto önizleme"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-[11px] text-zinc-400">Foto seçilmedi</span>
        )}
      </div>

      {/* Dosya seç */}
      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900">
        {photoUploading ? "Yükleniyor..." : "Foto Seç"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </label>

      {/* URL ve hata alanları */}
      {photoUrl && (
        <div className="mt-2 max-w-full break-all rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          URL: {photoUrl}
        </div>
      )}

      {photoError && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {photoError}
        </div>
      )}
    </div>
  );
}
