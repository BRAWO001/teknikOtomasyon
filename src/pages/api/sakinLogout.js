import { deleteCookie } from "@/utils/cookieHelper";

export default function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", ["GET", "POST"]);

    return res.status(405).json({
      success: false,
      message: "Desteklenmeyen istek metodu.",
    });
  }

  /*
   * Sakin oturum bilgisi
   */
  deleteCookie(res, "SakinUserInfo");

  /*
   * Personel sistemiyle uyumluluk için
   * sakin girişinde oluşturulan cookie
   */
  deleteCookie(res, "PersonelUserInfo");

  /*
   * Ortak JWT ve rol cookie'leri
   */
  deleteCookie(res, "AuthToken_01");
  deleteCookie(res, "PersonelRol");

  /*
   * Eski şirket oturumunun kalmasını engeller
   */
  deleteCookie(res, "SirketUserInfo");

  if (req.method === "POST") {
    return res.status(200).json({
      success: true,
      message: "Çıkış işlemi başarılı.",
      redirectUrl: "/sakinGiris",
    });
  }

  return res.redirect(302, "/sakinGiris");
}