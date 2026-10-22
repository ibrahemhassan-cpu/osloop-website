export const GA_ID = 'G-D459YHGKXM'
export const LEAD_CONVERSION = 'AW-18238858840/IT81CO2X-r8cENjM-_hD'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function track(event: string, parameters: Record<string, unknown> = {}) {
  // Tracking must never interrupt navigation or message delivery.
  try {
    window.gtag?.('event', event, { send_to: GA_ID, ...parameters })
  } catch { /* An unavailable analytics service does not block the site. */ }
}

export function trackForm(event: string, formId = 'webflow-form', parameters: Record<string, unknown> = {}) {
  track(event, { form_id: formId, form_name: formId === 'webflow-form' ? 'Project enquiry' : 'Arabic enquiry', ...parameters })
}

export function trackLead(formId = 'webflow-form') {
  trackForm('form_submit', formId)
  trackForm('generate_lead', formId, { value: 1, currency: 'EGP' })
  track('conversion', { send_to: LEAD_CONVERSION, value: 1, currency: 'EGP' })
}
