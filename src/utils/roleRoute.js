// src/utils/roleRoute.js

export function getRouteByRole(rol) {
  switch (rol) {
    case 20:
      return "/teknik";
    case 11:
      return "/YonetimKurulu";
    case 22:
      return "/iletisimGorevli";
    case 30:
      return "/personel";
    case 33:
      return "/peyzajPersonel";
    case 34:
      return "/havuzPersonel";
    case 40:
      return "/projeGorevlileri";
    case 44:
      return "/satinAlim";
    case 35:
      return "/idariPersonel";
    case 90:
      return "/teknikMudur";
    case 60:
      return "/genelMudur";
    case 70:
      return "/patron";
    case 10:
    default:
      return "/satinAlim";
  }
}
  