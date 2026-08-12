"use client";

import { useEffect, useRef, useState } from "react";

export default function KameraTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [kameraAcik, setKameraAcik] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      stopCamera();

      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setKameraAcik(false);
  };

  const konumAl = () => {
    setLocation(null);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Bu cihaz konum özelliğini desteklemiyor.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error("Konum hatası:", error);

        if (error.code === 1) {
          setLocationError("Konum izni reddedildi.");
        } else if (error.code === 2) {
          setLocationError("Konum bilgisine ulaşılamadı.");
        } else if (error.code === 3) {
          setLocationError("Konum alınırken zaman aşımı oluştu.");
        } else {
          setLocationError("Konum alınamadı.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const kamerayiAc = async () => {
    try {
      setLoading(true);
      setCameraError("");

      if (typeof window === "undefined") {
        return;
      }

      const host = window.location.hostname;
      const localhostMu =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1";

      if (!window.isSecureContext && !localhostMu) {
        setCameraError(
          "Kamera için HTTPS gereklidir. Sayfayı HTTPS adresinden açın. Telefonla yerel IP üzerinden HTTP kullanıyorsanız kamera çalışmayabilir."
        );
        return;
      }

      if (!navigator.mediaDevices) {
        setCameraError(
          "Kamera API'sine ulaşılamadı. Tarayıcınız veya bağlantınız kamera erişimini desteklemiyor olabilir."
        );
        return;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        setCameraError(
          "Bu tarayıcı getUserMedia özelliğini desteklemiyor."
        );
        return;
      }

      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
        setPhotoUrl("");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
          } catch (err) {
            console.error("Video oynatma hatası:", err);
          }
        };
      }

      setKameraAcik(true);

      konumAl();
    } catch (error) {
      console.error("Kamera açılamadı:", error);

      if (error?.name === "NotAllowedError") {
        setCameraError(
          "Kamera izni reddedildi. Tarayıcı ayarlarından bu site için kamera izni verin."
        );
      } else if (error?.name === "NotFoundError") {
        setCameraError(
          "Bu cihazda kullanılabilir bir kamera bulunamadı."
        );
      } else if (error?.name === "NotReadableError") {
        setCameraError(
          "Kamera başka bir uygulama tarafından kullanılıyor olabilir."
        );
      } else if (error?.name === "OverconstrainedError") {
        setCameraError(
          "İstenen kamera ayarları bu cihaz tarafından desteklenmiyor."
        );
      } else if (error?.name === "SecurityError") {
        setCameraError(
          "Tarayıcı güvenlik nedeniyle kameraya erişimi engelledi."
        );
      } else {
        setCameraError(
          `Kamera açılamadı: ${error?.message || "Bilinmeyen hata"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const roundedRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  };

  const fotografCek = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setCameraError("Kamera veya canvas hazır değil.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError(
        "Kamera görüntüsü henüz hazır değil. Birkaç saniye sonra tekrar deneyin."
      );
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setCameraError("Fotoğraf oluşturma alanı hazırlanamadı.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    const now = new Date();

    const tarih = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(now);

    const saat = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);

    const lines = [
      `${tarih}  ${saat}`,
      location
        ? `Konum: ${location.latitude.toFixed(
            6
          )}, ${location.longitude.toFixed(6)}`
        : "Konum: Alınamadı",
    ];

    if (location?.accuracy) {
      lines.push(
        `GPS doğruluğu: ±${Math.round(location.accuracy)} m`
      );
    }

    const fontSize = Math.max(
      24,
      Math.round(width * 0.024)
    );

    const smallFontSize = Math.max(
      18,
      Math.round(fontSize * 0.72)
    );

    const paddingX = Math.max(
      24,
      Math.round(width * 0.022)
    );

    const paddingY = Math.max(
      18,
      Math.round(height * 0.018)
    );

    const margin = Math.max(
      20,
      Math.round(width * 0.018)
    );

    const lineGap = Math.round(fontSize * 0.45);

    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";

    let maxTextWidth = 0;

    lines.forEach((line, index) => {
      ctx.font =
        index < 2
          ? `600 ${fontSize}px Arial, sans-serif`
          : `500 ${smallFontSize}px Arial, sans-serif`;

      maxTextWidth = Math.max(
        maxTextWidth,
        ctx.measureText(line).width
      );
    });

    const lineHeights = lines.map((_, index) =>
      index < 2 ? fontSize : smallFontSize
    );

    const contentHeight =
      lineHeights.reduce((sum, item) => sum + item, 0) +
      lineGap * (lines.length - 1);

    const boxWidth = maxTextWidth + paddingX * 2;
    const boxHeight = contentHeight + paddingY * 2;

    const boxX = width - boxWidth - margin;
    const boxY = height - boxHeight - margin;

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";

    roundedRect(
      ctx,
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      Math.max(12, Math.round(fontSize * 0.45))
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";

    let currentY = boxY + paddingY;

    lines.forEach((line, index) => {
      const currentFontSize =
        index < 2 ? fontSize : smallFontSize;

      ctx.font =
        index < 2
          ? `600 ${currentFontSize}px Arial, sans-serif`
          : `500 ${currentFontSize}px Arial, sans-serif`;

      currentY += currentFontSize;

      ctx.fillText(
        line,
        width - margin - paddingX,
        currentY
      );

      currentY += lineGap;
    });

    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Fotoğraf oluşturulamadı.");
          return;
        }

        if (photoUrl) {
          URL.revokeObjectURL(photoUrl);
        }

        const url = URL.createObjectURL(blob);

        setPhotoUrl(url);

        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  };

  const fotografiKaydet = async () => {
    if (!photoUrl) return;

    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();

      const now = new Date();

      const dosyaAdi = `foto_${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}_${String(
        now.getHours()
      ).padStart(2, "0")}-${String(
        now.getMinutes()
      ).padStart(2, "0")}-${String(
        now.getSeconds()
      ).padStart(2, "0")}.jpg`;

      const file = new File(
        [blob],
        dosyaAdi,
        {
          type: "image/jpeg",
        }
      );

      if (
        navigator.canShare &&
        navigator.share &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          files: [file],
          title: "Çekilen Fotoğraf",
        });

        return;
      }

      const link = document.createElement("a");
      link.href = photoUrl;
      link.download = dosyaAdi;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Kaydetme hatası:", error);
        alert("Fotoğraf kaydedilemedi.");
      }
    }
  };

  const tekrarCek = async () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl("");
    }

    setLocation(null);
    setLocationError("");
    setCameraError("");

    await kamerayiAc();
  };

  return (
    <div className="camera-page">
      <div className="camera-card">
        <h1>Fotoğraf Çek</h1>

        <p className="description">
          Fotoğrafın sağ alt köşesine tarih, saat ve GPS
          konumu otomatik olarak işlenir.
        </p>

        {!kameraAcik && !photoUrl && (
          <button
            type="button"
            className="main-button"
            onClick={kamerayiAc}
            disabled={loading}
          >
            {loading
              ? "Kamera Açılıyor..."
              : "Kamerayı Aç"}
          </button>
        )}

        {kameraAcik && (
          <>
            <div className="video-wrapper">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
              />
            </div>

            <div className="location-info">
              {location ? (
                <>
                  <strong>Konum hazır</strong>

                  <span>
                    {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </span>

                  <small>
                    GPS doğruluğu yaklaşık ±
                    {Math.round(
                      location.accuracy || 0
                    )}{" "}
                    metre
                  </small>
                </>
              ) : locationError ? (
                <span className="error-text">
                  {locationError}
                </span>
              ) : (
                <span>Konum alınıyor...</span>
              )}
            </div>

            <div className="button-row">
              <button
                type="button"
                className="secondary-button"
                onClick={stopCamera}
              >
                İptal
              </button>

              <button
                type="button"
                className="capture-button"
                onClick={fotografCek}
              >
                Fotoğraf Çek
              </button>
            </div>
          </>
        )}

        {photoUrl && (
          <>
            <div className="preview-title">
              Çekilen Fotoğraf
            </div>

            <img
              src={photoUrl}
              alt="Tarih ve konum bilgisi eklenmiş fotoğraf"
              className="photo-preview"
            />

            <div className="button-row">
              <button
                type="button"
                className="secondary-button"
                onClick={tekrarCek}
              >
                Tekrar Çek
              </button>

              <button
                type="button"
                className="save-button"
                onClick={fotografiKaydet}
              >
                Fotoğrafı Kaydet
              </button>
            </div>
          </>
        )}

        {cameraError && (
          <div className="error-box">
            {cameraError}
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            display: "none",
          }}
        />
      </div>

      <style jsx>{`
        .camera-page {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 24px 12px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .camera-card {
          width: 100%;
          max-width: 680px;
          background: #ffffff;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 8px 30px
            rgba(0, 0, 0, 0.08);
        }

        h1 {
          margin: 0 0 8px;
          font-size: 26px;
        }

        .description {
          margin: 0 0 20px;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        .video-wrapper {
          overflow: hidden;
          border-radius: 16px;
          background: #111;
        }

        .camera-video {
          display: block;
          width: 100%;
          max-height: 72vh;
          object-fit: cover;
          background: #111;
        }

        .photo-preview {
          width: 100%;
          display: block;
          border-radius: 16px;
          margin-top: 10px;
        }

        .preview-title {
          margin-top: 4px;
          font-weight: 700;
          font-size: 17px;
        }

        .location-info {
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          background: #f7f7f7;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }

        .location-info small {
          color: #777;
        }

        .button-row {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        button {
          border: 0;
          border-radius: 12px;
          padding: 13px 18px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .main-button,
        .capture-button {
          background: #111;
          color: #fff;
        }

        .main-button {
          width: 100%;
        }

        .capture-button,
        .save-button,
        .secondary-button {
          flex: 1;
        }

        .save-button {
          background: #167d3f;
          color: #fff;
        }

        .secondary-button {
          background: #ececec;
          color: #222;
        }

        .error-box {
          margin-top: 16px;
          padding: 12px;
          background: #fff0f0;
          color: #a40000;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.5;
        }

        .error-text {
          color: #a40000;
        }

        @media (max-width: 600px) {
          .camera-page {
            padding: 0;
            background: #fff;
          }

          .camera-card {
            max-width: none;
            min-height: 100vh;
            border-radius: 0;
            box-shadow: none;
            padding: 14px;
          }

          h1 {
            font-size: 22px;
          }

          .button-row {
            position: sticky;
            bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
}