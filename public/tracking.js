(function () {
  'use strict';
  if (window.osloopTrackingReady) return;
  window.osloopTrackingReady = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'AW-18238858840');
  window.gtag('config', 'AW-11360409165');
  // GA4 enhanced measurement handles initial loads and browser history changes.
  window.gtag('config', 'G-D459YHGKXM');
  // Existing dev-1 page-load conversion. This is separate from a submitted lead.
  window.gtag('event', 'conversion', { send_to: 'AW-11360409165/RhPZCMbrwesYEM2siKkq' });

  function event(name, parameters) {
    try { window.gtag('event', name, Object.assign({ send_to: 'G-D459YHGKXM' }, parameters)); } catch (_) {}
  }
  document.addEventListener('click', function (e) {
    var target = e.target instanceof Element ? e.target : null;
    var cta = target && target.closest('[data-open-form], a[href$="#contact"]');
    if (cta) event('form_open', {
      form_id: location.pathname.indexOf('/ar/landing') === 0 ? 'popup-lead-form' : 'webflow-form',
      trigger: cta.hasAttribute('data-open-form') ? 'dialog' : 'contact_link'
    });
    var link = target && target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) event('contact_click', { contact_method: 'email' });
    if (/^tel:/i.test(href)) event('contact_click', { contact_method: 'phone' });
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) event('contact_click', { contact_method: 'whatsapp' });
  }, true);
})();
