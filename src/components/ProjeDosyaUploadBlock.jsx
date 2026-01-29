




import { useMemo, useRef, useState } from "react";

// ✅ Site yönetimine uygun seçenekler
const TUR_OPTIONS = [
  { value: "Genel", label: "Genel" },
  { value: "Tutanak", label: "Tutanak" },
  { value: "KararDefteri", label: "Karar Defteri" },
  { value: "Sozlesme", label: "Sözleşme" },
  { value: "Ihtarname", label: "İhtarname" },
];

function isImageFile(file) {
  if (!file) return false;
  return (
    file.type?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name || "")
  );
}

export default function ProjeDosyaUploadBlock({ uploadAndAttach }) {
  const [uploading, setUploading] = useState(false);

  // ✅ Alanlar
  const [tur, setTur] = useState("");
  const [belgeBasligi, setBelgeBasligi] = useState("");
  const [belgeAciklamasi, setBelgeAciklamasi] = useState("");

  // ✅ Dosya (tek dosya)
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // ✅ Görsel preview (tek görsel ama 2’li grid ile gösteriyoruz)
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const revokeRef = useRef(null);

  // ✅ Genel mesajlar
  const [successUrl, setSuccessUrl] = useState("");

  // ✅ Alan bazlı hatalar
  const [fieldErrors, setFieldErrors] = useState({
    tur: "",
    belgeBasligi: "",
    belgeAciklamasi: "",
    file: "",
  });

  // ✅ Drag & Drop state
  const [dragOver, setDragOver] = useState(false);

  const clearMessages = () => setSuccessUrl("");

  const resetFieldErrors = () => {
    setFieldErrors({ tur: "", belgeBasligi: "", belgeAciklamasi: "", file: "" });
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileName("");

    if (revokeRef.current) {
      URL.revokeObjectURL(revokeRef.current);
      revokeRef.current = null;
    }
    setImagePreviewUrl("");
  };

  const setPickedFile = (file) => {
    clearMessages();

    setSelectedFile(file);
    setFileName(file.name);

    // dosya hatasını temizle
    setFieldErrors((p) => ({ ...p, file: "" }));

    // görsel ise preview üret
    if (isImageFile(file)) {
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
      const blobUrl = URL.createObjectURL(file);
      revokeRef.current = blobUrl;
      setImagePreviewUrl(blobUrl);
    } else {
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
      revokeRef.current = null;
      setImagePreviewUrl("");
    }
  };

  const onFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPickedFile(file);
    e.target.value = "";
  };

  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setFieldErrors((p) => ({
        ...p,
        file: "Lütfen sadece görsel seçin (jpg/png/webp).",
      }));
      e.target.value = "";
      return;
    }

    setPickedFile(file);
    e.target.value = "";
  };

  // ✅ Drag & Drop handlers
  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setFieldErrors((p) => ({
        ...p,
        file: "Sürükle-bırak alanı sadece görsel içindir (jpg/png/webp).",
      }));
      return;
    }

    setPickedFile(file);
  };

  const validateBeforeUpload = () => {
    const b = belgeBasligi.trim();
    const a = belgeAciklamasi.trim();

    const next = { tur: "", belgeBasligi: "", belgeAciklamasi: "", file: "" };

    if (!tur) next.tur = "Lütfen dosya türü seçiniz.";
    if (!b) next.belgeBasligi = "Belge Başlığı zorunlu.";
    if (!a) next.belgeAciklamasi = "Belge Açıklaması zorunlu.";
    if (!selectedFile) next.file = "Lütfen bir dosya / görsel seçin.";

    setFieldErrors(next);

    return !Object.values(next).some(Boolean);
  };

  const handleUploadClick = async () => {
    clearMessages();
    resetFieldErrors();

    const ok = validateBeforeUpload();
    if (!ok) return;

    try {
      setUploading(true);

      const url = await uploadAndAttach(selectedFile, {
        tur,
        belgeBasligi: belgeBasligi.trim(),
        belgeAciklamasi: belgeAciklamasi.trim(),
      });

      setSuccessUrl(url);

      // ✅ başarılı olunca temizle
      clearSelectedFile();
      // setTur("");
      // setBelgeBasligi("");
      // setBelgeAciklamasi("");
    } catch (err) {
      console.error("Dosya upload hata:", err);
      setFieldErrors((p) => ({
        ...p,
        file:
          err?.response?.data?.Message ||
          err?.response?.data ||
          err?.message ||
          "Dosya yüklenirken bir hata oluştu.",
      }));
    } finally {
      setUploading(false);
    }
  };

  const canUpload = useMemo(() => {
    return (
      !uploading &&
      !!selectedFile &&
      !!tur &&
      belgeBasligi.trim().length > 0 &&
      belgeAciklamasi.trim().length > 0
    );
  }, [uploading, selectedFile, tur, belgeBasligi, belgeAciklamasi]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      {/* ÜST: başlık + tür */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Dosya / Görsel Yükle
        </div>

        <div className="flex flex-col items-end">
          <select
            value={tur}
            onChange={(e) => {
              setTur(e.target.value);
              setFieldErrors((p) => ({ ...p, tur: "" }));
            }}
            className={`rounded-lg border bg-white px-2 py-1 text-[11px] text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200
              ${
                fieldErrors.tur
                  ? "border-red-400 focus:border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
          >
            <option value="" disabled>
              Tür seçiniz...
            </option>
            {TUR_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {fieldErrors.tur && (
            <div className="mt-1 text-[10px] text-red-600">{fieldErrors.tur}</div>
          )}
        </div>
      </div>

      {/* Belge Başlığı */}
      <div className="mb-2">
        <div className="mb-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          Belge Başlığı <span className="text-red-600">*</span>
        </div>
        <input
          value={belgeBasligi}
          onChange={(e) => {
            setBelgeBasligi(e.target.value);
            setFieldErrors((p) => ({ ...p, belgeBasligi: "" }));
          }}
          placeholder="Örn: Yönetim Kurulu Kararı - Ocak 2026"
          className={`w-full rounded-lg border bg-white px-3 py-2 text-[12px] text-zinc-800 outline-none dark:bg-zinc-950 dark:text-zinc-100
            ${
              fieldErrors.belgeBasligi
                ? "border-red-400 focus:border-red-500"
                : "border-zinc-300 focus:border-zinc-500 dark:border-zinc-700"
            }`}
        />
        {fieldErrors.belgeBasligi && (
          <div className="mt-1 text-[10px] text-red-600">
            {fieldErrors.belgeBasligi}
          </div>
        )}
      </div>

      {/* Belge Açıklaması */}
      <div className="mb-2">
        <div className="mb-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          Belge Açıklaması <span className="text-red-600">*</span>
        </div>
        <textarea
          value={belgeAciklamasi}
          onChange={(e) => {
            setBelgeAciklamasi(e.target.value);
            setFieldErrors((p) => ({ ...p, belgeAciklamasi: "" }));
          }}
          placeholder="Kısa açıklama..."
          rows={3}
          className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-[12px] text-zinc-800 outline-none dark:bg-zinc-950 dark:text-zinc-100
            ${
              fieldErrors.belgeAciklamasi
                ? "border-red-400 focus:border-red-500"
                : "border-zinc-300 focus:border-zinc-500 dark:border-zinc-700"
            }`}
        />
        {fieldErrors.belgeAciklamasi && (
          <div className="mt-1 text-[10px] text-red-600">
            {fieldErrors.belgeAciklamasi}
          </div>
        )}
      </div>

      {/* ✅ Drag & Drop (Görsel) */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`mb-2 rounded-xl border border-dashed p-8 text-center text-[11px] transition
          ${
            dragOver
              ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
          }`}
      >
        <div className=" mb-1 font-semibold">GÖRSELİ  SÜRÜKLEYİP BIRAKINIZ  </div>
        <span className="font-extralight " > Görsel sayısı fazla ise <strong className="font-extrabold" > Pdf </strong> formatında tarayıp yükleyiniz </span>

        {imagePreviewUrl && (
  <div className="mt-3 flex justify-center">
    <div className="mx-auto overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePreviewUrl}
        alt="preview"
        className="h-28 w-28 object-cover"
      />
    </div>
  </div>
)}

      </div>

      {/* Dosya seç + Görsel seç + Temizle + Yükle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900">
            Dosya Seç ( Pdf. )
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={onFilePick}
            />
          </label>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900">
            Görsel Seç
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImagePick}
            />
          </label>

          {selectedFile && (
            <button
              type="button"
              onClick={clearSelectedFile}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Seçimi Temizle
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading} // ✅ upload sırasında disable
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          {uploading ? "Yükleniyor..." : "Yükle"}
        </button>
      </div>

      {/* ✅ Yükle validation: seçim yoksa uyarı burada görünür */}
      {!canUpload && !uploading && (
        <div className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
          Yüklemek için: <b>Tür</b> seç, <b>Başlık</b> + <b>Açıklama</b> doldur ve{" "}
          <b>dosya/görsel</b> seç.
        </div>
      )}

      {fileName && (
        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Seçilen: <span className="font-semibold">{fileName}</span>
        </div>
      )}

      {fieldErrors.file && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {fieldErrors.file}
        </div>
      )}

      {successUrl && (
        <div className="mt-2 max-w-full break-all rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Yüklendi ✅ URL: {successUrl}
        </div>
      )}
    </div>
  );
}
