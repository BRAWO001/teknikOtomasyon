/* =========================================
   ✅ 2) API ROUTE
   Path: src/pages/api/gemini/extract-json.js
========================================= */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { rawText, aciklama } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: "Metin zorunlu" });
    }
    if (!aciklama || !String(aciklama).trim()) {
      return res.status(400).json({ error: "Açıklama zorunlu" });
    }

    const apiKey = "AIzaSyBvzk4YEWzKcnU4-RLNn3_tT2S510diCxs";
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY yok" });
    }

    const safeAciklama = String(aciklama).trim();

    // ✅ SABİT PROMPT (aynı şema, sadece JSON)
    // ✅ Açıklama: kullanıcıdan geldiği için JSON'a mutlaka yaz
    const prompt = `
Sen bir finansal veri çıkarma motorusun.

Kullanıcıdan gelen metni analiz et ve SADECE aşağıdaki JSON şemasında cevap ver.
Başka hiçbir açıklama yazma.
Kod bloğu kullanma.
Sadece geçerli JSON döndür.

KURALLAR:
- Şema dışına çıkma.
- Bulamadığın alanlara null yaz.
- Sayısal alanlar number olmalı.
- Virgüllü sayıları noktaya çevir.
- Para sembollerini kaldır.
- faturaKesen ve faturaKesilen maksimum 25 karakter olmalı (25'ten fazlasını kes).
- Kalem bulunamazsa boş array dön.
- "aciklama" alanı KESİNLİKLE doldurulmalı. Kullanıcının verdiği açıklamayı aynen yaz.

JSON ŞEMASI (ANAHTAR ADLARI DEĞİŞMEYECEK):
{
  "aciklama": string,
  "faturaNo": null,
  "faturaTarihi": null,
  "faturaKesen": null,
  "faturaKesilen": null,
  "hesaplananKdv": null,
  "malHizmetToplamTutari": null,
  "odenecekTutar": null,
  "kalemler": [
    {
      "malHizmet": null,
      "miktar": null,
      "birimFiyat": null,
      "malHizmetTutari": null
    }
  ]
}

KULLANICI AÇIKLAMA:
${safeAciklama}

METİN:
${String(rawText)}
`.trim();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini hatası",
        raw: data,
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(400).json({
        error: "Model JSON döndürmedi",
        rawText: text,
      });
    }

    // ✅ açıklamayı garantiye al: model yazmasa bile biz basarız
    parsed.aciklama = safeAciklama;

    // ✅ ekstra garanti: 25 karakter kes
    const cut25 = (v) => (v == null ? null : String(v).slice(0, 25));
    parsed.faturaKesen = cut25(parsed?.faturaKesen);
    parsed.faturaKesilen = cut25(parsed?.faturaKesilen);

    return res.status(200).json({ json: parsed });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
