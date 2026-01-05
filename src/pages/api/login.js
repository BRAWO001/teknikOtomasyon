// // pages/api/login.js
// import axios from "axios";
// import https from "https";
// import { setCookie } from "@/utils/cookieHelper";

// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "https://pilotapisrc.com/api";

// const httpsAgent = API_BASE_URL.includes("localhost")
//   ? new https.Agent({ rejectUnauthorized: false })
//   : undefined;

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).end();

//   const { tel, sifre } = req.body;

//   try {
//     const apiRes = await axios.post(
//       `${API_BASE_URL}/Personeller/PersonelLogin`,
//       { telefon: tel, sifre },
//       { httpsAgent }
//     );

//     const { personel, token } = apiRes.data;

//     if (!personel || !token) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Geçersiz kullanıcı" });
//     }

//     // 🍪 Personel bilgisi (sadece personel objesi)
//     // ÖRNEK: {"id":1,"personelKodu":"PRS-001",...}
//     setCookie(res, "PersonelUserInfo", JSON.stringify(personel), {
//       httpOnly: false,
//     });

//     // 🍪 Token (apiService / client okumak için)
//     setCookie(res, "AuthToken_01", token, {
//       httpOnly: false,
//     });

//     return res.status(200).json({
//       success: true,
//       rol: personel.rol,
//     });
//   } catch (err) {
//     console.error("Login API hatası:", err?.response?.data || err.message);

//     return res
//       .status(500)
//       .json({ success: false, message: "Login hatası" });
//   }
// }
// pages/login.jsx
import { useState } from "react";
import axios from "axios";
import { askNotificationPermission, subscribeUserToPush, saveSubscriptionToApi } from "@/utils/notifications";
import { getCookie } from "@/utils/cookieHelper";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [tel, setTel] = useState("");
  const [sifre, setSifre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Senin /pages/api/login.js'ine istek
      const res = await axios.post("/api/login", { tel, sifre });
      const { success } = res.data;

      if (!success) {
        setError("Giriş başarısız");
        setLoading(false);
        return;
      }

      // 📌 Cookie'ler burada set edilmiş durumda (PersonelUserInfo & AuthToken_01)
      const personelJson = getCookie("PersonelUserInfo");
      let personelId = null;

      if (personelJson) {
        try {
          const personel = JSON.parse(personelJson);
          personelId = personel.id;
        } catch {
          console.warn("PersonelUserInfo parse edilemedi");
        }
      }

      if (!personelId) {
        console.warn("PersonelId yok, bildirim aboneliği atlandı.");
        setLoading(false);
        router.push("/"); // veya personel sayfan
        return;
      }

      // 🔔 Bildirim izni (daha önce verdiyse tekrar sormaz)
      const permission = await askNotificationPermission();

      if (permission === "granted") {
        const subscription = await subscribeUserToPush();

        if (subscription) {
          await saveSubscriptionToApi({
            personelId,
            cihazTipi: 10, // Web = 10 (backend enum'unla eşle)
            cihazAdi: navigator.userAgent, // istersen daha düzenli bir string kullan
            subscription,
          });
        }
      } else {
        console.log("Bildirim izni verilmedi veya iptal edildi:", permission);
      }

      setLoading(false);
      router.push("/"); // veya personel paneli
    } catch (err) {
      console.error("Login error:", err?.response?.data || err.message);
      setError("Beklenmeyen hata");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Giriş Yap</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Telefon</label>
          <input value={tel} onChange={(e) => setTel(e.target.value)} />
        </div>
        <div>
          <label>Şifre</label>
          <input type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
