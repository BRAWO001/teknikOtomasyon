export const PERSONEL_OPTIONS = [
  "Ali Oğuz",
  "Burcu Kuş",
  "Cem Eren",
  "Çağlar Şenol",
  "Özer Aydın",
  "IBAN Hesap Eos",
].sort((a, b) => a.localeCompare(b, "tr"));

export const TEMIZLIK_OPTIONS = [
  "Ev Temizlik",
  "Cam Temizlik",
  "Ofis Temizlik",
  "Apartman Temizlik",
  "İnşaat Sonrası Temizlik",
  "Koltuk Temizlik",
  "Genel Temizlik",
  "Diğer",
];

export const EMPTY_SUMMARY = {
  toplamAlinanTutar: 0,
  toplamMalzemeTutari: 0,
  toplamDusulenTutar: 0,
  toplamIscilikTutari: 0,
  genelBakiye: 0,
  ibanliKayitSayisi: 0,
  nakitKayitSayisi: 0,
  nakit: {
    kayitSayisi: 0,
    toplamAlinan: 0,
    toplamMalzeme: 0,
    kasayaKalan: 0,
  },
  iban: {
    kayitSayisi: 0,
    toplamAlinan: 0,
    toplamMalzeme: 0,
    kasayaKalan: 0,
  },
};
