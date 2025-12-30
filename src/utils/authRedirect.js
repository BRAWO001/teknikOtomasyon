// src/utils/authRedirect.js
import { getCookie } from "@/utils/cookieHelper";
import { getRouteByRole } from "@/utils/roleRoute";

export async function checkAuthRedirect(context) {
  const isLoginPage = context.resolvedUrl === "/";

  // Sadece login sayfasında redirect yapıyoruz
  if (!isLoginPage) return null;

  const personelCookie = getCookie(context.req, "PersonelUserInfo");

  if (!personelCookie) {
    // Cookie yok → login gözüksün
    return null;
  }

  try {
    // Cookie doğrudan personel objesi
    const personel = JSON.parse(personelCookie);
    const rol = personel.rol ?? personel.Rol;

    const destination = getRouteByRole(rol);

    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  } catch (err) {
    console.error("PersonelUserInfo parse hatası:", err);
    return null;
  }
}
