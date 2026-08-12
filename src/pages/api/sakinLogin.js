import axios from "axios";
import https from "https";
import {
  setCookie,
  deleteCookie,
} from "@/utils/cookieHelper";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://localhost:7289/api";

const httpsAgent = API_BASE_URL.includes("localhost")
  ? new https.Agent({
      rejectUnauthorized: false,
    })
  : undefined;

/**
 * Cookie içine yalnızca gerçekten ihtiyaç duyulan daire
 * bilgilerini koyar.
 *
 * Backend'den gelen tüm ilişki geçmişini cookie'ye yazmak
 * 4096 byte sınırının aşılmasına neden olur.
 */
function sadeDaireIliskisiOlustur(item) {
  if (!item) return null;

  const iliski = item.iliski || {};
  const daire = item.daire || {};

  return {
    iliski: {
      id: iliski.id ?? null,
      daireMeskenBolumId:
        iliski.daireMeskenBolumId ?? daire.id ?? null,
      daireMeskenBolumKullaniciId:
        iliski.daireMeskenBolumKullaniciId ?? null,
      iliskiTipKod: iliski.iliskiTipKod ?? null,
      iliskiTipAd: iliski.iliskiTipAd ?? null,
      aktifMi: iliski.aktifMi ?? true,
    },

    daire: {
      id: daire.id ?? null,
      siteId: daire.siteId ?? null,
      aptId: daire.aptId ?? null,
      blokAdi: daire.blokAdi ?? null,
      katNo: daire.katNo ?? null,
      daireNo: daire.daireNo ?? null,
      bagimsizBolumNo: daire.bagimsizBolumNo ?? null,
      adres: daire.adres ?? null,
    },
  };
}

/**
 * ASP.NET Core varsayılan JSON ayarında alanlar camelCase gelir.
 * Farklı JSON ayarlarında PascalCase gelme ihtimaline karşı iki
 * biçimi de destekliyoruz.
 */
function alanOku(object, camelCaseAlan, pascalCaseAlan) {
  return object?.[camelCaseAlan] ?? object?.[pascalCaseAlan] ?? null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);

    return res.status(405).json({
      success: false,
      message: "Sadece POST isteği kabul edilir.",
    });
  }

  const { tel, telefon, sifre } = req.body || {};

  const kullaniciTelefonu = String(
    telefon || tel || ""
  ).trim();

  const kullaniciSifresi = String(sifre || "").trim();

  if (!kullaniciTelefonu) {
    return res.status(400).json({
      success: false,
      message: "Telefon zorunlu.",
    });
  }

  if (!kullaniciSifresi) {
    return res.status(400).json({
      success: false,
      message: "Şifre zorunlu.",
    });
  }

  try {
    const apiRes = await axios.post(
      `${API_BASE_URL}/AppMobil/WebLogin`,
      {
        telefon: kullaniciTelefonu,
        sifre: kullaniciSifresi,
      },
      {
        httpsAgent,
        timeout: 15000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const apiData = apiRes.data || {};

    const success = apiData.success === true;
    const token = apiData.token;
    const kullanici = apiData.kullanici;

    if (!success || !kullanici || !token) {
      return res.status(401).json({
        success: false,
        message:
          apiData.message ||
          "Geçersiz kullanıcı bilgileri.",
      });
    }

    const aktifMi = alanOku(
      kullanici,
      "aktifMi",
      "AktifMi"
    );

    if (aktifMi === false) {
      return res.status(403).json({
        success: false,
        code: "SAKIN_INACTIVE",
        message:
          "Hesabınız aktif değildir. Lütfen yönetim ile iletişime geçiniz.",
      });
    }

    const sakinRol = Number(apiData.rol || 77);

    const gelenAktifDaire =
      apiData.aktifDaire ||
      apiData.AktifDaire ||
      null;

    const sadeAktifDaire =
      sadeDaireIliskisiOlustur(gelenAktifDaire);

    /*
     * Cookie içinde yalnızca aktif daireyi saklıyoruz.
     *
     * Bütün ilişki geçmişi gerektiğinde ilgili context
     * servisinden tekrar alınmalıdır.
     */
    const sadeDaireIliskileri = sadeAktifDaire
      ? [sadeAktifDaire]
      : [];

    const sakinUserInfo = {
      id: alanOku(kullanici, "id", "Id"),

      adi: alanOku(kullanici, "adi", "Adi"),
      soyadi: alanOku(kullanici, "soyadi", "Soyadi"),
      firmaAdi: alanOku(
        kullanici,
        "firmaAdi",
        "FirmaAdi"
      ),

      telefon: alanOku(
        kullanici,
        "telefon",
        "Telefon"
      ),

      email: alanOku(
        kullanici,
        "email",
        "Email"
      ),

      kullaniciTipKod: alanOku(
        kullanici,
        "kullaniciTipKod",
        "KullaniciTipKod"
      ),

      kullaniciTipAd: alanOku(
        kullanici,
        "kullaniciTipAd",
        "KullaniciTipAd"
      ),

      aktifMi,
      mobilGirisAktifMi: alanOku(
        kullanici,
        "mobilGirisAktifMi",
        "MobilGirisAktifMi"
      ),

      rol: sakinRol,
      rolKod: sakinRol,
      kullaniciTipi: "sakin",

      aktifSiteId:
        apiData.aktifSiteId ??
        apiData.AktifSiteId ??
        sadeAktifDaire?.daire?.siteId ??
        null,

      aktifAptId:
        apiData.aktifAptId ??
        apiData.AktifAptId ??
        sadeAktifDaire?.daire?.aptId ??
        null,

      aktifDaireMeskenBolumId:
        apiData.aktifDaireMeskenBolumId ??
        apiData.AktifDaireMeskenBolumId ??
        sadeAktifDaire?.daire?.id ??
        null,

      aktifDaire: sadeAktifDaire?.daire || null,
      daireIliskileri: sadeDaireIliskileri,

      /*
       * İzin isimleri genellikle kısa olduğu için saklanabilir.
       */
      sayfalar: Array.isArray(apiData.sayfalar)
        ? apiData.sayfalar
        : [],
    };

    /*
     * Personel sistemi bazı yerlerde yalnızca temel kullanıcı
     * bilgilerini kontrol ediyor. Buraya büyük sakin nesnesini
     * tekrar yazmıyoruz.
     */
    const personelUyumlulukBilgisi = {
      id: sakinUserInfo.id,
      adi: sakinUserInfo.adi,
      soyadi: sakinUserInfo.soyadi,
      telefon: sakinUserInfo.telefon,
      rol: sakinRol,
      rolKod: sakinRol,
      kullaniciTipi: "sakin",
      aktifSiteId: sakinUserInfo.aktifSiteId,
    };

    /*
     * Önce eski oturum cookie'lerini temizle.
     */
    deleteCookie(res, "SakinUserInfo");
    deleteCookie(res, "PersonelUserInfo");
    deleteCookie(res, "SirketUserInfo");
    deleteCookie(res, "AuthToken_01");
    deleteCookie(res, "PersonelRol");

    const ortakCookieOptions = {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };

    /*
     * Sayfalar client tarafında SakinUserInfo okuyabildiği için
     * şimdilik httpOnly false kalıyor.
     */
    setCookie(
      res,
      "SakinUserInfo",
      JSON.stringify(sakinUserInfo),
      {
        ...ortakCookieOptions,
        httpOnly: false,
      }
    );

    /*
     * Aynı büyük nesneyi ikinci kez yazmıyoruz.
     */
    setCookie(
      res,
      "PersonelUserInfo",
      JSON.stringify(personelUyumlulukBilgisi),
      {
        ...ortakCookieOptions,
        httpOnly: false,
      }
    );

    /*
     * JWT mümkün olduğunca JavaScript tarafından okunmamalıdır.
     * Ancak apiService token'ı document.cookie üzerinden okuyorsa
     * bunu false bırakman gerekir.
     */
    setCookie(res, "AuthToken_01", token, {
      ...ortakCookieOptions,
      httpOnly: false,
    });

    setCookie(
      res,
      "PersonelRol",
      String(sakinRol),
      {
        ...ortakCookieOptions,
        httpOnly: false,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Giriş işlemi başarılı.",

      rol: sakinRol,
      redirectUrl: "/sakinGiris/sakin",

      kullaniciId: sakinUserInfo.id,

      aktifSiteId: sakinUserInfo.aktifSiteId,
      aktifAptId: sakinUserInfo.aktifAptId,
      aktifDaireMeskenBolumId:
        sakinUserInfo.aktifDaireMeskenBolumId,

      sayfalar: sakinUserInfo.sayfalar,
    });
  } catch (err) {
    const apiStatus = err?.response?.status;
    const apiData = err?.response?.data;

    /*
     * Server terminalinde gerçek backend hatasını gösterir.
     */
    console.error("Sakin login API hatası:", {
      url: `${API_BASE_URL}/AppMobil/WebLogin`,
      status: apiStatus,
      code: err?.code,
      message: err?.message,
      backendResponse: apiData,
    });

    if (apiStatus === 400) {
      return res.status(400).json({
        success: false,
        message:
          apiData?.message ||
          (typeof apiData === "string" ? apiData : null) ||
          "Gönderilen giriş bilgileri geçersiz.",
      });
    }

    if (apiStatus === 401) {
      return res.status(401).json({
        success: false,
        message:
          apiData?.message ||
          "Telefon veya şifre hatalı.",
      });
    }

    if (apiStatus === 403) {
      return res.status(403).json({
        success: false,
        code: apiData?.code || "FORBIDDEN",
        message:
          apiData?.message ||
          "Bu kullanıcının giriş yetkisi bulunmuyor.",
      });
    }

    if (apiStatus >= 500) {
      return res.status(502).json({
        success: false,
        message:
          apiData?.message ||
          "Ana API giriş işlemini tamamlayamadı.",
      });
    }

    if (err?.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message:
          "Sunucu zamanında yanıt vermedi. Lütfen tekrar deneyiniz.",
      });
    }

    if (
      err?.code === "ECONNREFUSED" ||
      err?.cause?.code === "ECONNREFUSED"
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Ana API sunucusuna bağlantı kurulamadı.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Giriş işlemi sırasında bir hata oluştu.",
    });
  }
}