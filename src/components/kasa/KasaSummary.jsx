import { moneyTR } from "./helpers";

function SummaryCard({ title, value, className, valuePrefix = "" }) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${className}`}>
      <div className="text-[10px] font-semibold">{title}</div>
      <div className="text-[13px] font-extrabold">
        {valuePrefix}
        {moneyTR(value)}
      </div>
    </div>
  );
}

function PaymentSummary({ title, data, className }) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold">{title}</div>
        <div className="text-[10px] font-semibold">
          {data.kayitSayisi} kayıt
        </div>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-1 text-[10px]">
        <div>
          <div>Alınan</div>
          <div className="font-extrabold">{moneyTR(data.toplamAlinan)}</div>
        </div>

        <div>
          <div>Malzeme</div>
          <div className="font-extrabold">{moneyTR(data.toplamMalzeme)}</div>
        </div>

        <div>
          <div>Kasaya Kalan</div>
          <div className="font-extrabold">{moneyTR(data.kasayaKalan)}</div>
        </div>
      </div>
    </div>
  );
}

export default function KasaSummary({ ozet }) {
  return (
    <>
      <div className="grid gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          title="Toplam Alınan"
          value={ozet.toplamAlinanTutar}
          className="border-emerald-200 bg-emerald-50 text-emerald-900"
        />

        <SummaryCard
          title="Düşülen Malzeme"
          value={ozet.toplamDusulenTutar}
          valuePrefix="- "
          className="border-rose-200 bg-rose-50 text-rose-900"
        />

        <SummaryCard
          title="Malzeme Gideri"
          value={ozet.toplamMalzemeTutari}
          className="border-zinc-200 bg-zinc-50 text-zinc-900"
        />

        <SummaryCard
          title="İşçilik"
          value={ozet.toplamIscilikTutari}
          className="border-indigo-200 bg-indigo-50 text-indigo-900"
        />

        <SummaryCard
          title="Kasaya Kalan Bakiye"
          value={ozet.genelBakiye}
          className="border-sky-200 bg-sky-50 text-sky-900"
        />
      </div>

      <div className="grid gap-1.5 border-t border-zinc-100 p-2 sm:grid-cols-2">
        <PaymentSummary
          title="Nakit"
          data={ozet.nakit}
          className="border-amber-200 bg-amber-50 text-amber-950"
        />

        <PaymentSummary
          title="IBAN"
          data={ozet.iban}
          className="border-emerald-200 bg-emerald-50 text-emerald-950"
        />
      </div>
    </>
  );
}
