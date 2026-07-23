import ModalField from "./ModalField";
import {
  PERSONEL_OPTIONS,
  TEMIZLIK_OPTIONS,
} from "./constants";
import { moneyTR } from "./helpers";

function MoneyInput({ value, onChange }) {
  return (
    <div className="relative">
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder="0,00"
        className="h-9 w-full rounded-md border border-zinc-300 px-2 pr-8 text-xs outline-none focus:border-sky-500"
      />

      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-400">
        ₺
      </span>
    </div>
  );
}

export default function CreateKasaModal({
  open,
  saving,
  form,
  formError,
  formSuccess,
  calculatedBalance,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
          <div>
            <div className="text-sm font-extrabold text-zinc-900">
              Yeni Kasa Kaydı
            </div>

            <div className="text-[10px] text-zinc-500">
              İş emrinden bağımsız manuel kayıt
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <ModalField label="İşlem Türü" required>
              <select
                required
                value={form.baslik}
                onChange={(event) => onChange("baslik", event.target.value)}
                className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-sky-500"
              >
                {TEMIZLIK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Ödeme Tipi" required>
              <select
                required
                value={form.odemeTipi}
                onChange={(event) =>
                  onChange("odemeTipi", event.target.value)
                }
                className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-sky-500"
              >
                <option value="Nakit">Nakit</option>
                <option value="IBAN">IBAN</option>
              </select>
            </ModalField>

            <ModalField label="Teslim Edilen Kişi / Hesap" required>
              <select
                required
                value={form.teslimEdilenPersonel}
                onChange={(event) =>
                  onChange("teslimEdilenPersonel", event.target.value)
                }
                className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-sky-500"
              >
                <option value="">Seçiniz</option>

                {PERSONEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Kayıt Tarihi" required>
              <input
                required
                type="datetime-local"
                value={form.kasaKayitTarihi}
                onChange={(event) =>
                  onChange("kasaKayitTarihi", event.target.value)
                }
                className="h-9 w-full rounded-md border border-zinc-300 px-2 text-xs outline-none focus:border-sky-500"
              />
            </ModalField>

            <ModalField label="Kaydı Yapan Personel">
              <input
                type="text"
                value={form.kaydiYapanPersonel}
                readOnly
                placeholder="Oturum açan personel"
                className="h-9 w-full cursor-not-allowed rounded-md border border-zinc-300 bg-zinc-100 px-2 text-xs font-semibold text-zinc-700 outline-none"
              />
            </ModalField>

            <ModalField label="Alınan Toplam Tutar">
              <MoneyInput
                value={form.alinanToplamTutar}
                onChange={(event) =>
                  onChange("alinanToplamTutar", event.target.value)
                }
              />
            </ModalField>

            <ModalField label="Malzeme Tutarı">
              <MoneyInput
                value={form.malzemeTutari}
                onChange={(event) =>
                  onChange("malzemeTutari", event.target.value)
                }
              />
            </ModalField>

            <ModalField label="İşçilik Tutarı">
              <MoneyInput
                value={form.iscilikTutari}
                onChange={(event) =>
                  onChange("iscilikTutari", event.target.value)
                }
              />
            </ModalField>

            <div className="rounded-md border border-sky-200 bg-sky-50 p-2">
              <div className="text-[10px] font-semibold text-sky-700">
                Kasaya Kalan
              </div>

              <div
                className={`text-sm font-extrabold ${
                  calculatedBalance < 0
                    ? "text-rose-700"
                    : "text-sky-900"
                }`}
              >
                {moneyTR(calculatedBalance)}
              </div>

              <div className="mt-0.5 text-[9px] text-sky-600">
                Alınan toplam - malzeme tutarı
              </div>
            </div>

            <div className="sm:col-span-2">
              <ModalField label="Açıklama">
                <textarea
                  rows={4}
                  value={form.aciklama}
                  onChange={(event) =>
                    onChange("aciklama", event.target.value)
                  }
                  placeholder="Kayıt açıklaması..."
                  className="w-full resize-none rounded-md border border-zinc-300 px-2 py-2 text-xs outline-none focus:border-sky-500"
                />
              </ModalField>
            </div>

            {formError && (
              <div className="sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-[11px] font-semibold text-rose-700">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="sm:col-span-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-[11px] font-semibold text-emerald-700">
                {formSuccess}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 rounded-md border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 disabled:opacity-50"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-md bg-sky-600 px-5 text-xs font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kaydı Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
