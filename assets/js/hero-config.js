// Resolve a partir do HTML para que a mesma imagem funcione no CSS e no WebGL,
// inclusive quando o site estiver hospedado em uma subpasta.
window.HENKE_HERO_IMAGE = new URL('assets/images/henke-02.jpg', document.baseURI).href;
window.HENKE_HERO_IMAGE_MOBILE = new URL('assets/images/henke-03.jpg', document.baseURI).href;
