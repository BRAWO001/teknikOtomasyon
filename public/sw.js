if(!self.define){let e,s={};const n=(n,a)=>(n=new URL(n+".js",a).href,s[n]||new Promise(s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()}).then(()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e}));self.define=(a,i)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let c={};const r=e=>n(e,t),o={module:{uri:t},exports:c,require:r};s[t]=Promise.all(a.map(e=>o[e]||r(e))).then(e=>(i(...e),c))}}define(["./workbox-4754cb34"],function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/dynamic-css-manifest.json",revision:"d751713988987e9331980363e24189ce"},{url:"/_next/static/chunks/222-63f0a212b0bafb49.js",revision:"63f0a212b0bafb49"},{url:"/_next/static/chunks/230-7ce16ebd86b9de86.js",revision:"7ce16ebd86b9de86"},{url:"/_next/static/chunks/494.0bfdf534d4777fad.js",revision:"0bfdf534d4777fad"},{url:"/_next/static/chunks/6-34d1cd630892a256.js",revision:"34d1cd630892a256"},{url:"/_next/static/chunks/641-2343c5e413815483.js",revision:"2343c5e413815483"},{url:"/_next/static/chunks/763.361bd0be0cf1ba1f.js",revision:"361bd0be0cf1ba1f"},{url:"/_next/static/chunks/framework-d7de93249215fb06.js",revision:"d7de93249215fb06"},{url:"/_next/static/chunks/main-e0fd28e421b4626e.js",revision:"e0fd28e421b4626e"},{url:"/_next/static/chunks/pages/_app-520d87554bf7172b.js",revision:"520d87554bf7172b"},{url:"/_next/static/chunks/pages/_error-de1c64435fe2d9b7.js",revision:"de1c64435fe2d9b7"},{url:"/_next/static/chunks/pages/genelMudur-793c5538a6351090.js",revision:"793c5538a6351090"},{url:"/_next/static/chunks/pages/idariPersonel-41132089791aacd5.js",revision:"41132089791aacd5"},{url:"/_next/static/chunks/pages/idariPersonel/onayiBekleyenler-4e32f00759bb986c.js",revision:"4e32f00759bb986c"},{url:"/_next/static/chunks/pages/idariPersonel/reddedilenler-2aab9e32542f93e4.js",revision:"2aab9e32542f93e4"},{url:"/_next/static/chunks/pages/idariPersonel/yeni-6b849369f9d70808.js",revision:"6b849369f9d70808"},{url:"/_next/static/chunks/pages/index-e98360eea42266cc.js",revision:"e98360eea42266cc"},{url:"/_next/static/chunks/pages/kontrol-dc1bc705296dc3a1.js",revision:"dc1bc705296dc3a1"},{url:"/_next/static/chunks/pages/patron-58bd37040304eaa7.js",revision:"58bd37040304eaa7"},{url:"/_next/static/chunks/pages/personel-05f07714116ad95c.js",revision:"05f07714116ad95c"},{url:"/_next/static/chunks/pages/projeGorevlileri-7116c846f41fc47b.js",revision:"7116c846f41fc47b"},{url:"/_next/static/chunks/pages/projeGorevlileri/taleplerim-37d8077b496b3aea.js",revision:"37d8077b496b3aea"},{url:"/_next/static/chunks/pages/projeGorevlileri/yeni-5c3c5db01c08ee07.js",revision:"5c3c5db01c08ee07"},{url:"/_next/static/chunks/pages/satinAlim-d0ec0c39dfdd5f28.js",revision:"d0ec0c39dfdd5f28"},{url:"/_next/static/chunks/pages/satinalma/fiyatlandir/%5Btoken%5D-aeeb1c0277fa0171.js",revision:"aeeb1c0277fa0171"},{url:"/_next/static/chunks/pages/satinalma/liste-f79baf51ee5bc6f1.js",revision:"f79baf51ee5bc6f1"},{url:"/_next/static/chunks/pages/satinalma/onayBekleyen-af180d3cdec6be88.js",revision:"af180d3cdec6be88"},{url:"/_next/static/chunks/pages/satinalma/onaylananTalepler-c77a39d21fbf6ed6.js",revision:"c77a39d21fbf6ed6"},{url:"/_next/static/chunks/pages/satinalma/reddedilen-2d06014b8683bae9.js",revision:"2d06014b8683bae9"},{url:"/_next/static/chunks/pages/satinalma/teklifler/%5Bid%5D-4f163e49c0295078.js",revision:"4f163e49c0295078"},{url:"/_next/static/chunks/pages/satinalma/yeni-50f57b190f4b131a.js",revision:"50f57b190f4b131a"},{url:"/_next/static/chunks/pages/sw-2f96530f7eb5fbac.js",revision:"2f96530f7eb5fbac"},{url:"/_next/static/chunks/pages/teknik-bf0babe33e1dd265.js",revision:"bf0babe33e1dd265"},{url:"/_next/static/chunks/pages/teknik/isEmriDetay/%5Bid%5D-eea62bee78af4998.js",revision:"eea62bee78af4998"},{url:"/_next/static/chunks/pages/teknikAnaSayfa-8bbc33cffcc58840.js",revision:"8bbc33cffcc58840"},{url:"/_next/static/chunks/pages/teknikIsEmriEkle-d12fbb96b5111e88.js",revision:"d12fbb96b5111e88"},{url:"/_next/static/chunks/pages/teknikMudur-6c95866133a12f1e.js",revision:"6c95866133a12f1e"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-216711ff2be973ac.js",revision:"216711ff2be973ac"},{url:"/_next/static/css/51d1fbb28cb767f1.css",revision:"51d1fbb28cb767f1"},{url:"/_next/static/ryPPb5ibCplBl7pxanThB/_buildManifest.js",revision:"9e30c78f2bf165125dc5e6164cb687a2"},{url:"/_next/static/ryPPb5ibCplBl7pxanThB/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/favicon.ico",revision:"c30c7d42707a47a3f4591831641e50dc"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/manifest.json",revision:"b06179233171226f038a00774694a059"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:a})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")},new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")},new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({url:e})=>!(self.origin===e.origin),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")});
/* public/sw.js */

// Bu guard sayesinde Next.js build sırasında (Node ortamında) hata almayacağız.
if (typeof self === "undefined") {
  // Node / SSR ortamı -> service worker kodunu çalıştırma
} else {
  // Push mesajı geldiğinde çalışır
  self.addEventListener("push", function (event) {
    if (!event.data) {
      return;
    }

    let data = {};
    try {
      data = event.data.json(); // .NET'ten JSON gönderiyoruz (title, body, url vs.)
    } catch {
      data = { title: "Bildirim", body: event.data.text() };
    }

    const title = data.title || "Bildirim";
    const options = {
      body: data.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: {
        url: data.url || "/", // tıklayınca açılacak adres
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  });

  // Bildirime tıklanınca
  self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.postMessage({ type: "OPEN_URL", url });
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  });
}
