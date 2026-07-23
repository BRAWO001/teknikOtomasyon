import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { roleGuard } from "@/utils/roleGuard";

import CreateKasaModal from "@/components/kasa/CreateKasaModal";
import KasaFilters from "@/components/kasa/KasaFilters";
import KasaHeader from "@/components/kasa/KasaHeader";
import KasaSummary from "@/components/kasa/KasaSummary";
import KasaTable from "@/components/kasa/KasaTable";
import Pagination from "@/components/kasa/Pagination";

import { EMPTY_SUMMARY } from "@/components/kasa/constants";

import {
  createInitialForm,
  getCurrentPersonelAdSoyad,
  getDefaultRange,
  normalizeSummary,
  parseAmount,
  startsWithEOS,
} from "@/components/kasa/helpers";





export const getServerSideProps = (ctx) =>
  roleGuard(ctx, {
    allow: [40, 90, 30, 33, 34],
    redirectTo: "/",
  });

const PAGE_SIZE = 25;

export default function KasaKayitlariPage() {
  const router = useRouter();
  const defaultRange = useMemo(() => getDefaultRange(), []);

  const [items, setItems] = useState([]);
  const [ozet, setOzet] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    personel: "",
    isEmriKod: "",
    odemeTipi: "tumu",
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [form, setForm] = useState(createInitialForm);

  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();

    qs.set("page", String(page));
    qs.set("pageSize", String(PAGE_SIZE));

    if (filters.search.trim()) {
      qs.set("search", filters.search.trim());
    }

    if (filters.personel.trim()) {
      qs.set("personel", filters.personel.trim());
    }

    if (filters.isEmriKod.trim()) {
      qs.set("isEmriKod", filters.isEmriKod.trim());
    }

    if (filters.odemeTipi !== "tumu") {
      qs.set("odemeTipi", filters.odemeTipi);
    }

    if (filters.startDate) {
      qs.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
      qs.set("endDate", filters.endDate);
    }

    return `kasa-kayit?${qs.toString()}`;
  }, [page, filters]);

  const loadKasaKayitlari = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getDataAsync(endpoint);

      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Number(res?.totalPages) || 1);
      setTotalCount(Number(res?.totalCount) || 0);
      setOzet(normalizeSummary(res?.ozet));
    } catch (error) {
      console.error("Kasa kayıtları GET hata:", error);

      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
      setOzet(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    loadKasaKayitlari();
  }, [loadKasaKayitlari]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));

    setPage(1);
  }

  function resetFilters() {
    setFilters({
      search: "",
      personel: "",
      isEmriKod: "",
      odemeTipi: "tumu",
      startDate: "",
      endDate: "",
    });

    setPage(1);
  }

  function resetForm() {
    setForm(createInitialForm());
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    resetForm();
    setFormError("");
    setFormSuccess("");
    setModalOpen(true);
  }

  function closeCreateModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setFormError("");
    setFormSuccess("");
  }

  function goDetail(id, not1Value) {
    if (!id || !startsWithEOS(not1Value)) {
      return;
    }

    router.push(`/kasaKayitlari/${id}`);
  }

  async function submitCreate(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setFormError("");
    setFormSuccess("");

    const baslik = String(form.baslik ?? "").trim();
    const teslimEdilenPersonel = String(
      form.teslimEdilenPersonel ?? ""
    ).trim();
    const kaydiYapanPersonel = getCurrentPersonelAdSoyad();

    if (!baslik) {
      setFormError("İşlem türü seçilmelidir.");
      return;
    }

    if (!teslimEdilenPersonel) {
      setFormError("Teslim edilen kişi veya hesap seçilmelidir.");
      return;
    }

    if (!kaydiYapanPersonel) {
      setFormError(
        "Kaydı yapan personel bilgisi cookie üzerinden alınamadı. Lütfen yeniden giriş yapın."
      );
      return;
    }

    const iscilikTutari = parseAmount(form.iscilikTutari);
    const malzemeTutari = parseAmount(form.malzemeTutari);
    const alinanToplamTutar = parseAmount(form.alinanToplamTutar);

    if (
      iscilikTutari < 0 ||
      malzemeTutari < 0 ||
      alinanToplamTutar < 0
    ) {
      setFormError("Tutarlar negatif olamaz.");
      return;
    }

    let kasaKayitTarihiUtc = null;

    if (form.kasaKayitTarihi) {
      const selectedDate = new Date(form.kasaKayitTarihi);

      if (Number.isNaN(selectedDate.getTime())) {
        setFormError("Geçerli bir kayıt tarihi seçin.");
        return;
      }

      kasaKayitTarihiUtc = selectedDate.toISOString();
    }

    const payload = {
      baslik,
      aciklama: String(form.aciklama ?? "").trim() || null,
      teslimEdilenPersonel,
      iscilikTutari,
      malzemeTutari,
      alinanToplamTutar,
      kasaKayitTarihiUtc,
      odemeTipi: form.odemeTipi || "Nakit",
      kaydiYapanPersonel,
    };

    setSaving(true);

    try {
      const res = await postDataAsync("kasa-kayit/manuel", payload);

      setFormSuccess(
        res?.message || "Kasa kaydı başarıyla eklendi."
      );

      setPage(1);
      await loadKasaKayitlari();

      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Kasa kaydı ekleme hatası:", error);

      const apiData = error?.response?.data;
      const apiMessage =
        apiData?.message ||
        apiData?.title ||
        (typeof apiData === "string" ? apiData : null);

      setFormError(apiMessage || "Kasa kaydı eklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  const calculatedBalance =
    parseAmount(form.alinanToplamTutar) -
    parseAmount(form.malzemeTutari);

  return (
    <div className="space-y-2 p-2">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <KasaHeader
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          ozet={ozet}
          loading={loading}
          onCreate={openCreateModal}
          onBack={() => router.back()}
          onHome={() => router.push("/")}
          onReset={resetFilters}
          onRefresh={loadKasaKayitlari}
        />

        <KasaSummary ozet={ozet} />

        <KasaFilters
          filters={filters}
          onChange={updateFilter}
          onSearch={loadKasaKayitlari}
        />
      </div>

      <KasaTable
        items={items}
        loading={loading}
        onDetail={goDetail}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        loading={loading}
        onPageChange={setPage}
      />

      <CreateKasaModal
        open={modalOpen}
        saving={saving}
        form={form}
        formError={formError}
        formSuccess={formSuccess}
        calculatedBalance={calculatedBalance}
        onChange={updateForm}
        onClose={closeCreateModal}
        onSubmit={submitCreate}
      />
    </div>
  );
}
