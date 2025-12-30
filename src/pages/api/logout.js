// pages/api/logout.js
import { deleteCookie } from "@/utils/cookieHelper";

export default function handler(req, res) {
  deleteCookie(res, "PersonelUserInfo");
  deleteCookie(res, "SirketUserInfo");
  deleteCookie(res, "AuthToken_01");
  deleteCookie(res, "PersonelRol");

  res.redirect(302, "/");
}
