// pages/teknik.jsx
import { getCookie } from "@/utils/cookieHelper";

export async function getServerSideProps(context) {
  const cookie = getCookie(context.req, "PersonelUserInfo");

  if (!cookie) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const personel = JSON.parse(cookie);

  // burada istersen rol kontrolü yapıp yetkisizse 403/redirect de yapabilirsin

  return {
    props: { personel },
  };
}

export default function TeknikPage({ personel }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Merhaba Teknik Personel</h1>

      <div className="text-sm opacity-90 text-center mb-4">
        <p><b>Ad:</b> {personel.ad}</p>
        <p><b>Soyad:</b> {personel.soyad}</p>
        <p><b>Telefon:</b> {personel.telefon}</p>
        <p><b>Kullanıcı:</b> {personel.kullaniciAdi}</p>
        <p><b>Rol:</b> {personel.rol}</p>
      </div>

      <a
        href="/api/logout"
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
      >
        Çıkış Yap
      </a>
    </div>
  );
}
