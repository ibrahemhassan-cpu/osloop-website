# dev-1 integrations on dev-3

The current English and Arabic layouts, typography, media and animations are retained. Integrations are adapted to the current React site and the existing PHP/Apache hosting.

## Google tracking

| Configuration | Preserved ID |
| --- | --- |
| Google Analytics 4 | `G-D459YHGKXM` |
| Google Ads | `AW-18238858840` |
| Google Ads legacy account | `AW-11360409165` |
| Accepted lead conversion | `AW-18238858840/IT81CO2X-r8cENjM-_hD` |
| Existing page-load conversion | `AW-11360409165/RhPZCMbrwesYEM2siKkq` |

`public/tracking.js` initializes the shared Google tags on the current English and Arabic pages. The legacy page-load conversion remains separate from the accepted-lead conversion. Repeated Google loaders and duplicate page-load snippets from the old homepage are consolidated on those current pages. The five restored standalone HTML pages retain their original scripts from `dev-1` without changes.

GA4 uses its initial page and browser-history measurement. No second manual `page_view` is added. History-based page measurement depends on the GA4 web stream's enhanced measurement settings; account settings were not changed. See [Google's page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views).

The following events are available with stable form IDs: `webflow-form`, `lead-form`, and `popup-lead-form`.

| Event | Trigger |
| --- | --- |
| `form_open` | Contact CTA or campaign arrival |
| `form_view` | Form enters the viewport |
| `form_start` | First interaction with a form |
| `form_validation_error` | Local validation fails |
| `form_submit_attempt` | A valid request starts |
| `form_error` | Delivery fails or the response is invalid |
| `form_submit`, `generate_lead` | The PHP handler confirms successful delivery |
| Google Ads lead `conversion` | That same confirmed delivery, once per submission |
| `contact_click` | Email, telephone or WhatsApp link |

Custom analytics events do not include names, email addresses, telephone numbers, company names or message content. Missing or blocked analytics does not prevent a form submission. Conversion routing follows the [Google tag API](https://developers.google.com/tag-platform/gtagjs/reference).

No GTM container, Meta pixel, Clarity or separate error-monitoring service was present in the source tracking inspected on `dev-1`.

## Forms and hosting

- English posts multipart data to `/formAction.php`, using the original field names and preserving the current phone, company, service and budget selections.
- Arabic inline and popup forms post to `/ar/formAction.php`.
- SMTP connection configuration and recipients are retained from `dev-1`.
- The English handler uses the PHPMailer library already under `ar/src`. The build includes that dependency and the shared country lookup files.
- Both handlers disable SMTP output and return HTTP 200 with `{ "ok": true }` only when the mailer reports success. Clients reject an HTML fallback response or HTTP 204 as a lead success.
- Required-field validation, honeypots, HTML escaping and budget allow-lists remain. The English allow-list now also accepts the current visual form's `Less than $2,800` option. Arabic rejects array values before processing text fields.
- Country enrichment uses `/site-context.php` with a bounded, optional client lookup. A missing country never prevents submission.
- The existing arithmetic UI is a client-side check. No new captcha credentials were introduced.

`npm run build` produces the complete PHP/Apache upload in `dist`, including `.htaccess`. The old Vercel/Formspree endpoint is not used by this configuration.

The three original consultation URLs now serve the restored pages directly, including their original Calendly embeds and Google scripts. Their styles, scripts and images are included. `/request-your-video` still redirects to the current contact section with campaign parameters preserved. Existing `?request-your-video` arrivals also open the current contact section.

## SEO and discovery

- Homepage title, description, social previews, Organization structured data and referenced SEO images are carried over from `dev-1`.
- Both languages have canonical URLs and reciprocal language alternates.
- The build emits HTML with route-specific metadata, structured data and a no-JavaScript content fallback for current project routes. Client navigation updates the same metadata.
- `privacy-policy.html` and `terms-and-conditions.html` are restored as the original standalone files from `dev-1`, including their styles, content, metadata and scripts.
- The root `sitemap.xml` is restored from `dev-1`. The build preserves all original URLs and language alternates, then adds current project URLs. The build also generates a robots file. `llms.txt` retains the source agency information and adds the current project links.

## Verification on 22 October 2026

- `npm run typecheck` and `npm run build` pass.
- `python tests/formActionTest.py` passes using a stub mail transport. It covers both PHP handlers, malformed fields, invalid email, budget validation, honeypots, escaping and success responses. It sends no email.
- `php tests/countryLookupTest.php` and `php tests/siteContextTest.php` pass.
- Local Apache checks cover restored HTML routes, PHP method rejection, country JSON, robots, sitemap and discovery files. Consultation URLs serve HTTP 200 directly; the remaining campaign redirect preserves attribution.
- Browser checks cover English validation, failed requests, network failure, HTML fallback rejection, retries, success events and project/policy metadata. Arabic inline and popup flows pass on a mobile viewport, with no browser runtime errors.
- Real PHPMailer delivery to local Mailpit is verified for English, Arabic inline and Arabic popup submissions. Isolated test copies override only SMTP transport to `127.0.0.1:1025`; the production files retain their original SMTP settings and recipients. Existing Mailpit messages are preserved.
- Google endpoints were blocked during browser tests, and queued event payloads were inspected locally. These tests do not verify receipt in live Analytics or Ads dashboards or production inbox delivery.

Deployment is separate from committing and pushing these changes.

## Restored source files

The following six root files are copied unchanged from `dev-1`:

- `get-free-consultation.html`
- `get-free-healthcare-consultation.html`
- `get-free-real-estate-consultation.html`
- `privacy-policy.html`
- `terms-and-conditions.html`
- `sitemap.xml`

The five HTML files are copied unchanged into `dist` during every build. The built sitemap retains all original entries and language alternates and adds current project URLs. Fourteen original supporting assets are included. The source referenced a missing menu PNG; a small white menu glyph supplies that resource without changing the restored HTML.

The requested Google verification is source parity: the same GA4 ID, Ads IDs, conversion destinations and original scripts are in place. The parity report records those comparisons.
