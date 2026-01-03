// src/utils/roleRoute.js

export function getRouteByRole(rol) {
  switch (rol) {
    case 20:
      return "/teknik";
    case 30:
      return "/personel";
    case 40:
      return "/kontrol";
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
  