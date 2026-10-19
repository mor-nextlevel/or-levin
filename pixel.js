/* הפיקסל של מטא, לדף הנחיתה ולדף התודה.
   מדביקים את המספר של הפיקסל בין הגרשיים בשורה הבאה, דוחפים, וזהו. בלי מספר לא נשלח כלום. */
var PIXEL_ID = '';

(function () {
  if (!PIXEL_ID) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  /* רק בדף התודה. רכישה נספרת פעם אחת, גם אם הדף מתרענן או נפתח שוב בשעתיים הקרובות */
  if (!document.documentElement.hasAttribute('data-purchase')) return;
  try {
    var last = +localStorage.getItem('hm_purchase') || 0;
    if (Date.now() - last < 2 * 3600e3) return;
    localStorage.setItem('hm_purchase', Date.now());
  } catch (e) {}
  fbq('track', 'Purchase', { value: 297, currency: 'ILS', content_name: 'HOME-MADE' });
})();
