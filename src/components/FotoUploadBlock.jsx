// src/components/FotoUploadBlock.jsx

import { useEffect, useState } from "react";

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
      const ratio = Math.min(widthRatio, heightRatio, 1);

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

          // ✅ isim aynı kalabilir, ama type jpeg olacak (sunucu extension kontrol ediyorsa sorun olabilir)
          // Eğer sunucuda uzantı kontrolü varsa, aşağıdaki gibi .jpg'e çevirmek daha güvenli:
          const safeName = String(file.name || "photo.jpg").replace(/\.(png|webp|heic)$/i, ".jpg");

          const compressedFile = new File([blob], safeName, {
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

  // ✅ tek preview yerine: ilk foto preview (minimal)
  const [photoPreview, setPhotoPreview] = useState("");

  // ✅ çoklu url listesi
  const [photoUrls, setPhotoUrls] = useState([]);

  // ✅ çoklu hata listesi (istersen tek string de yaparız)
  const [photoError, setPhotoError] = useState("");

  // ✅ objectURL leak olmasın
  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = async (e) => {
    const list = Array.from(e.target.files || []).filter(Boolean);
    e.target.value = ""; // ✅ aynı dosyaları tekrar seçebilmek için reset
    if (list.length === 0) return;

    // ✅ max 5
    const picked = list.slice(0, 10);

    setPhotoError("");
    setPhotoUrls([]);

    try {
      setPhotoUploading(true);

      // 1) Sıkıştır (her birini)
      const compressedFiles = [];
      for (const f of picked) {
        const cf = await compressImageFile(f, 0.75, 1920, 1920);
        compressedFiles.push(cf);
      }

      // 2) Önizleme: sadece ilkini göster
      if (compressedFiles[0]) {
        const objUrl = URL.createObjectURL(compressedFiles[0]);
        setPhotoPreview((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return objUrl;
        });
      }

      // 3) Sırayla upload + iş emrine bağla
      const urls = [];
      for (const cf of compressedFiles) {
        const url = await uploadAndAttach(cf, 10);
        if (url) urls.push(url);
      }

      setPhotoUrls(urls);

      // İstersen upload sonrası preview'ı URL'e çevir:
      if (urls[0]) setPhotoPreview(urls[0]);
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
        Fotoğraf (Max 5)
      </div>

      {/* Önizleme (sadece 1 adet) */}
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

      {/* Dosya seç (✅ multiple) */}
      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900">
        {photoUploading ? "Yükleniyor..." : "Foto Seç (Toplu)"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoChange}
        />
      </label>

      {/* URL listesi */}
      {photoUrls.length > 0 && (
        <div className="mt-2 space-y-1">
          {photoUrls.map((u, idx) => (
            <div
              key={`${u}-${idx}`}
              className="max-w-full break-all rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              URL {idx + 1}: {u}
            </div>
          ))}
        </div>
      )}

      {/* Hata */}
      {photoError && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {photoError}
        </div>
      )}
    </div>
  );
}
