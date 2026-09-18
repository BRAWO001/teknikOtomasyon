import { useEffect, useState } from "react";
import {
  getDataAsync,
  postDataAsync,
} from "@/utils/apiService";

const UPLOAD_URL = "HttpUpload/upload-ftp";
const SAVE_URL_BASE = "anket-dosya";

const TUR = {
  FOTO: 10,
  BELGE: 20,
};

function fileExt(name) {
  const value = String(name || "");

  const index = value.lastIndexOf(".");

  return index >= 0
    ? value.slice(index + 1).toLowerCase()
    : "";
}


function isImage(file) {
  const type = String(file?.type || "")
    .toLowerCase();

  if (type.startsWith("image/"))
    return true;

  return [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "heic",
  ].includes(fileExt(file?.name));
}


function isDocument(file) {
  const type = String(file?.type || "")
    .toLowerCase();

  if (type.includes("pdf"))
    return true;

  return [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
  ].includes(fileExt(file?.name));
}


export default function AnketDosyaPanel({
  anketId,
}) {
  const [files, setFiles] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [msg, setMsg] = useState("");


  const loadFiles = async () => {
    if (!anketId)
      return;

    try {
      setLoading(true);
      setMsg("");

      const data =
        await getDataAsync(
          `${SAVE_URL_BASE}/${anketId}`
        );

      setFiles(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (e) {
      console.error(
        "ANKET DOSYA LOAD ERROR:",
        e
      );

      setMsg(
        "Anket dosyaları alınamadı."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    setFiles([]);
    setMsg("");

    if (anketId) {
      loadFiles();
    }
  }, [anketId]);


  const uploadFile = async (
    file,
    tur
  ) => {
    if (!anketId)
      return;

    try {
      setUploading(true);
      setMsg("");


      if (
        tur === TUR.FOTO &&
        !isImage(file)
      ) {
        throw new Error(
          "Lütfen fotoğraf seçiniz."
        );
      }


      if (
        tur === TUR.BELGE &&
        !isDocument(file)
      ) {
        throw new Error(
          "Lütfen belge seçiniz."
        );
      }


      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );


      const uploadResponse =
        await postDataAsync(
          UPLOAD_URL,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      const url =
        uploadResponse?.Url ??
        uploadResponse?.url;


      if (!url) {
        throw new Error(
          "Upload cevabında Url bulunamadı."
        );
      }


      const body = [
        {
          url,
          dosyaAdi: file.name,
          tur,
        },
      ];


      await postDataAsync(
        `${SAVE_URL_BASE}/${anketId}`,
        body,
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );


      await loadFiles();

      setMsg(
        "Dosya ankete başarıyla eklendi."
      );
    } catch (e) {
      console.error(
        "ANKET FILE UPLOAD ERROR:",
        e
      );

      setMsg(
        e?.message ||
          "Dosya yüklenemedi."
      );
    } finally {
      setUploading(false);
    }
  };


  const handleFile = (
    e,
    tur
  ) => {
    const file =
      e?.target?.files?.[0];

    if (e?.target)
      e.target.value = "";

    if (!file)
      return;

    uploadFile(
      file,
      tur
    );
  };


  const deleteFile =
    async (dosyaId) => {
      if (
        !anketId ||
        !dosyaId
      )
        return;

      const ok =
        window.confirm(
          "Bu dosyayı silmek istiyor musunuz?"
        );

      if (!ok)
        return;


      try {
        setDeletingId(dosyaId);
        setMsg("");


        const res =
          await postDataAsync(
            `${SAVE_URL_BASE}/dosya-sil`,
            {
              anketId:
                Number(anketId),

              dosyaId:
                Number(dosyaId),
            }
          );


        const items =
          res?.Items ??
          res?.items;


        if (Array.isArray(items)) {
          setFiles(items);
        } else {
          await loadFiles();
        }


        setMsg(
          "Dosya silindi."
        );
      } catch (e) {
        console.error(
          "ANKET FILE DELETE:",
          e
        );

        setMsg(
          "Dosya silinemedi."
        );
      } finally {
        setDeletingId(null);
      }
    };


  if (!anketId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        Dosya işlemleri için
        bir anket seçiniz.
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

        <div>
          <div className="text-base font-semibold">
            Anket Dosyaları
          </div>

          <div className="mt-1 text-[11px] text-zinc-500">
            Fotoğraf veya belge
            yükleyebilirsiniz.
          </div>
        </div>


        {msg && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] dark:border-zinc-800 dark:bg-zinc-950">
            {msg}
          </div>
        )}


        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-3 text-sm font-semibold">
              Fotoğraf
            </div>

            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-8 text-sm font-semibold text-sky-700 hover:bg-sky-50 dark:bg-zinc-900">

              {uploading
                ? "Yükleniyor..."
                : "Fotoğraf Seç"}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) =>
                  handleFile(
                    e,
                    TUR.FOTO
                  )
                }
              />

            </label>
          </div>


          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">

            <div className="mb-3 text-sm font-semibold">
              PDF / Belge
            </div>

            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-8 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:bg-zinc-900">

              {uploading
                ? "Yükleniyor..."
                : "Belge Seç"}

              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                className="hidden"
                disabled={uploading}
                onChange={(e) =>
                  handleFile(
                    e,
                    TUR.BELGE
                  )
                }
              />

            </label>
          </div>

        </div>
      </div>


      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

        <div className="mb-4 text-sm font-semibold">
          Ankete Eklenen Dosyalar
        </div>


        {loading ? (
          <div className="text-sm text-zinc-500">
            Yükleniyor...
          </div>
        ) : files.length === 0 ? (
          <div className="text-sm text-zinc-500">
            Bu ankete henüz
            dosya eklenmemiş.
          </div>
        ) : (
          <div className="space-y-3">

            {files.map((file) => {

              const id =
                file?.id ??
                file?.Id;

              const tur =
                file?.turKod ??
                file?.TurKod;

              const url =
                file?.url ??
                file?.Url;

              const dosyaAdi =
                file?.dosyaAdi ??
                file?.DosyaAdi ??
                "Dosya";

              const sira =
                file?.sira ??
                file?.Sira;


              return (
                <div
                  key={id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950"
                >

                  <div className="min-w-0">

                    <div className="text-sm font-semibold">
                      {dosyaAdi}
                    </div>

                    <div className="mt-1 text-[11px] text-zinc-500">
                      {Number(tur) === 10
                        ? "Fotoğraf"
                        : "Belge"}

                      {" • "}

                      Sıra: {sira}
                    </div>

                  </div>


                  <div className="flex gap-2">

                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[12px] font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      Aç
                    </a>


                    <button
                      type="button"
                      disabled={
                        deletingId === id
                      }
                      onClick={() =>
                        deleteFile(id)
                      }
                      className="rounded-lg border border-red-300 bg-white px-3 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-900"
                    >
                      {deletingId === id
                        ? "Siliniyor..."
                        : "Sil"}
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}