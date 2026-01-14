




// pages/api/login.js
import axios from "axios";
import https from "https";
import { setCookie } from "@/utils/cookieHelper";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pilotapisrc.com/api";

const httpsAgent = API_BASE_URL.includes("localhost")
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { tel, sifre } = req.body;

  try {
    const apiRes = await axios.post(
      `${API_BASE_URL}/Personeller/PersonelLogin`,
      { telefon: tel, sifre },
      { httpsAgent }
    );

    const { personel, token } = apiRes.data;

    if (!personel || !token) {
      return res
        .status(401)
        .json({ success: false, message: "Geçersiz kullanıcı" });
    }

    // ✅ AKTİF KONTROLÜ (PASİF İSE GİRİŞİ ENGELLE)
    // aktifMi false ise cookie yazma, token verme
    if (personel.aktifMi === false) {
      return res.status(403).json({
        success: false,
        code: "PERSONEL_INACTIVE",
        message:
          "Hesabınızın aktifleşmesi için lütfen  iletişime geçiniz.",
      });
    }

    // 🍪 Personel bilgisi (sadece personel objesi)
    setCookie(res, "PersonelUserInfo", JSON.stringify(personel), {
      httpOnly: false,
    });

    // 🍪 Token (apiService / client okumak için)
    setCookie(res, "AuthToken_01", token, {
      httpOnly: false,
    });

    // 🔁 Rol + personelId döndürüyoruz (yapıyı bozmadan)
    return res.status(200).json({
      success: true,
      rol: personel.rol,
      personelId: personel.id,
    });
  } catch (err) {
    const apiStatus = err?.response?.status;
    const apiData = err?.response?.data;

    console.error("Login API hatası:", apiData || err.message);

    // ✅ Backend zaten "pasif" için hata dönüyorsa onu aynen geçir (opsiyonel)
    if (apiStatus === 403) {
      return res.status(403).json({
        success: false,
        code: apiData?.code || "FORBIDDEN",
        message: apiData?.message || "Giriş yetkiniz yok.",
      });
    }

    return res
      .status(500)
      .json({ success: false, message: "Login hatası" });
  }
}
