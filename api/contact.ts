/**
 * Contact form endpoint (Vercel Function, Web API signature).
 *
 *  1. Drops honeypot submissions silently.
 *  2. Validates the required fields.
 *  3. Verifies the Cloudflare Turnstile token server-side — once TURNSTILE_SECRET_KEY is set.
 *     Until then the form's own quick check (a small sum) is the human check.
 *  4. Forwards the message to Formspree, which emails it to the team.
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   FORMSPREE_ENDPOINT     required, e.g. https://formspree.io/f/xxxxxxx
 *   TURNSTILE_SECRET_KEY   Cloudflare Turnstile secret key (set it together with the site key)
 */

type Body = {
  name?: string
  email?: string
  phone?: string
  company?: string
  needs?: string
  budget?: string
  message?: string
  token?: string
  website?: string // honeypot — real people never see or fill this
}

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export async function POST(request: Request): Promise<Response> {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return json(400, { error: 'invalid_body' })
  }

  // Bots fill every field; pretend it worked so they move on.
  if (body.website) return json(200, { ok: true })

  const required = [body.name, body.email, body.budget, body.message]
  if (required.some((v) => !v || !String(v).trim())) return json(400, { error: 'missing_fields' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) return json(400, { error: 'invalid_email' })

  const secret = process.env.TURNSTILE_SECRET_KEY
  const endpoint = process.env.FORMSPREE_ENDPOINT
  if (!endpoint) return json(500, { error: 'not_configured' })

  if (secret) {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: body.token ?? '',
        remoteip: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined,
      }),
    }).then((r) => r.json() as Promise<{ success: boolean }>)
    if (!verify.success) return json(403, { error: 'captcha_failed' })
  }

  const forward = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: body.name,
      email: body.email,
      phone: body.phone || 'Not given',
      company: body.company || 'Not given',
      needs: body.needs || 'Not specified',
      budget: body.budget,
      message: body.message,
      _subject: `New project brief from ${body.name}`,
      _replyto: body.email,
    }),
  })
  if (!forward.ok) return json(502, { error: 'delivery_failed' })
  return json(200, { ok: true })
}
