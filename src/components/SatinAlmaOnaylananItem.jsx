




// ===============================
// src/components/SatinAlmaOnaylananItem.jsx
// ===============================
import Link from "next/link";

function norm(v) {
  if (v == null) return "";
  return String(v).trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

function isValidHttpUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function Chip({ text, className = "", title }) {
  return (
    <span
      title={title || text}
      className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold ${className}`}
    >
      {text}
    </span>
  );
}

export default function SatinAlmaOnaylananItem({
  item,
  formatDateTime,
  formatDateOnly,
}) {
  const id = item.id ?? item.Id;
  const seriNo = item.seriNo ?? item.SeriNo;
  const tarih = item.tarih ?? item.Tarih;
  const talepCinsi = item.talepCinsi ?? item.TalepCinsi;
  const aciklama = item.aciklama ?? item.Aciklama;

  const site = item.site ?? item.Site ?? null;
  const malzemeSayisi = item.malzemeSayisi ?? item.MalzemeSayisi ?? 0;

  const talepEden = item.talepEden ?? item.TalepEden ?? null;

  const benimOnayKaydim = item.benimOnayKaydim ?? item.BenimOnayKaydim ?? null;
  const benimDurumAd = benimOnayKaydim?.durumAd ?? benimOnayKaydim?.DurumAd ?? "";
  const onayTarihiUtc =
    benimOnayKaydim?.onayTarihiUtc ??
    benimOnayKaydim?.OnayTarihiUtc ??
    null;

  // ⭐ En düşük teklifler (API'den gelen)
  const enDusukTeklifler = item.enDusukTeklifler ?? item.EnDusukTeklifler ?? [];

  // ✅ NOTLAR
  const not1 = item.not_1 ?? item.Not_1 ?? "";
  const not2 = item.not_2 ?? item.Not_2 ?? "";
  const not3 = item.not_3 ?? item.Not_3 ?? null;
  const not5 = item.not_5 ?? item.Not_5 ?? "";

  const not1Norm = norm(not1);
  const not3Norm = norm(not3);
  const not5Norm = norm(not5);

  // ✅ Not_1 -> satın alma durumu
  const satinAlindi = not1Norm.includes("satın alındı") || not1Norm.includes("satin alindi");
  const satinAlinmadi =
    not1Norm.includes("satın alınmadı") ||
    not1Norm.includes("satin alinmadi") ||
    not1Norm.includes("satın alinmadi");

  // ✅ Not_2 -> fatura (pdf url)
  const hasFatura = isValidHttpUrl(String(not2 || "").trim());

  // ✅ Not_3 -> teknik talep var mı
  const teknikVar = not3Norm === "evet" || not3Norm === "var" || not3Norm === "true";
  const teknikYok = not3Norm === "hayır" || not3Norm === "yok" || not3Norm === "false";

  // ✅ Not_5 -> süreç tamamlandı mı
  const surecTamamlandi =
    not5Norm.includes("süreç tamamlandı") || not5Norm.includes("surec tamamlandi");

  return (
    <Link
      href={`/satinalma/teklifler/${id}`}
      className="block border-b border-emerald-200 px-3 py-2 text-[12px] hover:bg-emerald-50"
    >
      {/* 1. SATIR */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-emerald-50 px-2 py-[2px] text-[11px] font-semibold text-emerald-700">
            Sıra No: {id}
          </span>
          <span className="text-[11px] font-medium text-zinc-800">Seri: {seriNo}</span>
        </div>

        <span className="text-[11px] text-zinc-500">{formatDateTime(tarih)}</span>
      </div>

      {/* 2. SATIR */}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-zinc-900">{talepCinsi}</span>

        {site ? (
          <span className="text-zinc-600">
            <span className="font-medium text-zinc-700">Site:</span>{" "}
            <span className="font-semibold">{site.ad ?? site.Ad}</span>
          </span>
        ) : (
          <span className="text-zinc-500">Site bilgisi yok</span>
        )}

        {talepEden && (
          <span className="text-zinc-600">
            <span className="font-medium text-zinc-700">Talep Eden:</span>{" "}
            {talepEden.ad ?? talepEden.Ad} {talepEden.soyad ?? talepEden.Soyad}
          </span>
        )}

        {benimOnayKaydim && (
          <span className="rounded-full bg-emerald-100 px-2 py-[2px] text-[11px] font-medium text-emerald-800">
            Sizin sonucunuz: {benimDurumAd}{" "}
            {onayTarihiUtc && (
              <span className="text-[10px] text-emerald-700">
                ({formatDateOnly(onayTarihiUtc)})
              </span>
            )}
          </span>
        )}
      </div>

      {/* ✅ 3. SATIR: DURUM CHIPS (Not_1 / Not_2 / Not_3 / Not_5) */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {/* Not_1 */}
        {satinAlindi ? (
          <Chip
            text="✅ Satın Alındı"
            className="bg-emerald-100 text-emerald-800"
            title={not1}
          />
        ) : satinAlinmadi ? (
          <Chip
            text="🚫 Satın Alınmadı"
            className="bg-rose-100 text-rose-800"
            title={not1}
          />
        ) : (
          <Chip
            text="⏳ Satın Alma: İşaretlenmedi"
            className="bg-zinc-100 text-zinc-700"
            title={not1 || "—"}
          />
        )}

        {/* Not_2 */}
        {hasFatura ? (
          <Chip
            text="🧾 Fatura: Var"
            className="bg-indigo-100 text-indigo-800"
            title={String(not2)}
          />
        ) : (
          <Chip text="🧾 Fatura: Yok" className="bg-zinc-100 text-zinc-700" />
        )}

        {/* Not_3 */}
        {teknikVar ? (
          <Chip text="🛠 Teknik Talep: Var" className="bg-amber-100 text-amber-900" />
        ) : teknikYok ? (
          <Chip text="🛠 Teknik Talep: Yok" className="bg-zinc-100 text-zinc-700" />
        ) : (
          <Chip text="🛠 Teknik Talep: —" className="bg-zinc-100 text-zinc-700" />
        )}

        {/* Not_5 */}
        {surecTamamlandi ? (
          <Chip text="🏁 Proje Yönetici Süreci: Tamamlandı" className="bg-sky-100 text-sky-900" title={not5} />
        ) : (
          <Chip
            text="🏁 Proje Yönetici Süreci: İşaretlenmedi"
            className="bg-zinc-100 text-zinc-700"
            title={not5 || "—"}
          />
        )}

        {/* Malzeme */}
        <Chip
          text={`📦 Malzeme: ${malzemeSayisi} kalem`}
          className="bg-emerald-50 text-emerald-800"
        />
      </div>

      {/* 4. SATIR: En düşük teklifler */}
      <div className="mt-1 text-zinc-600">
        <span className="font-medium block">En Düşük Teklifler:</span>
        {enDusukTeklifler.length === 0 ? (
          <span className="text-zinc-500">Teklif girilmemiş</span>
        ) : (
          <div className="mt-0.5 flex flex-col">
            {enDusukTeklifler.map((t, idx) => {
              const ad = t.tedarikciAdi ?? t.TedarikciAdi ?? "Tedarikçi";
              const pb = t.paraBirimi ?? t.ParaBirimi ?? "TRY";
              const tutar = Number(t.toplamTutar ?? t.ToplamTutar ?? 0);

              return (
                <span key={idx} className="font-semibold text-zinc-800">
                  {ad}{" "}
                  {tutar.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {pb}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Açıklama */}
      {aciklama && (
        <div className="mt-1 text-zinc-500 line-clamp-1">
          <span className="font-medium">Not:</span> {aciklama}
        </div>
      )}
    </Link>
  );
}
