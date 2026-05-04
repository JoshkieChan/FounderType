/* eslint-disable */
// Vercel Speed Insights and Web Analytics Script
// This file is automatically loaded by Vercel Analytics

// Load Vercel Analytics
(function (w, d, s, o, f, js, fjs) {
  w['AnalyticsObject'] = o;
  w[o] =
    w[o] ||
    function () {
      (w[o].q = w[o].q || []).push(arguments);
    };
  w[o].l = 1 * new Date();
  ((js = d.createElement(s)), (fjs = d.getElementsByTagName(s)[0]));
  js.async = 1;
  js.src = f;
  fjs.parentNode.insertBefore(js, fjs);
})(window, document, 'script', 'va', 'https://va.vercel.one/v1/analytics.js');

// Initialize analytics
if (typeof window !== 'undefined' && window.va) {
  window.va('pageview');
}
