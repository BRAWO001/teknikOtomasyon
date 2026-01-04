// pages/api/login.js
import axios from "axios";
import https from "https";
import { setCookie } from "@/utils/cookieHelper";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7289/api";

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

    // 🍪 Personel bilgisi (sadece personel objesi)
    // ÖRNEK: {"id":1,"personelKodu":"PRS-001",...}
    setCookie(res, "PersonelUserInfo", JSON.stringify(personel), {
      httpOnly: false,
    });

    // 🍪 Token (apiService / client okumak için)
    setCookie(res, "AuthToken_01", token, {
      httpOnly: false,
    });

    return res.status(200).json({
      success: true,
      rol: personel.rol,
    });
  } catch (err) {
    console.error("Login API hatası:", err?.response?.data || err.message);

    return res
      .status(500)
      .json({ success: false, message: "Login hatası" });
  }
}
