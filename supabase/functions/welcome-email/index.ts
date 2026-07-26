import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://sujeetsharma.in";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "hello@sujeetsharma.in";
const FROM_NAME = Deno.env.get("FROM_NAME") || "Sujeet Sharma";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const ADMIN_URL = `${SITE_URL}`;
const VERIFY_URL = `${SITE_URL}/newsletter/verify`;
const UNSUBSCRIBE_URL = `${SITE_URL}/newsletter/unsubscribe`;

// Lazy-init the service-role client inside the handler so a missing env var
// produces a clear error instead of crashing module load.
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (_supabase) return _supabase;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Best-effort client IP resolution. Prefers headers set by trusted edge
 * infrastructure (Cloudflare) over the generic X-Forwarded-For header, which
 * can be spoofed by the client if no trusted proxy overwrites it before the
 * request reaches this function. This is still best-effort — if you are not
 * behind Cloudflare, replace `cf-connecting-ip` with whatever header your
 * actual trusted proxy/CDN guarantees.
 */
function resolveClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const fwd = req.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",")[0]?.trim();
  return first || "unknown";
}

/* ------------------------------ Email HTML ------------------------------ */

function emailShell(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sujeet Sharma Newsletter</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;min-width:100%;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);overflow:hidden;">
        <tr><td style="padding:32px 40px 8px 40px;text-align:center;">
          <div style="display:inline-block;padding:8px 16px;border-radius:999px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.3px;">SUJEET SHARMA</div>
        </td></tr>
        ${innerHtml}
        <tr><td style="padding:24px 40px 40px 40px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0 0 12px 0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
            You are receiving this email because you subscribed to the Sujeet Sharma newsletter.
          </p>
          <p style="margin:0 0 16px 0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
            <a href="${ADMIN_URL}" style="color:#60a5fa;text-decoration:none;">sujeetsharma.in</a>
            &nbsp;&bull;&nbsp;
            <a href="https://github.com/" style="color:#60a5fa;text-decoration:none;">GitHub</a>
            &nbsp;&bull;&nbsp;
            <a href="https://www.linkedin.com/" style="color:#60a5fa;text-decoration:none;">LinkedIn</a>
            &nbsp;&bull;&nbsp;
            <a href="https://x.com/" style="color:#60a5fa;text-decoration:none;">X</a>
          </p>
          <p style="margin:0;color:#64748b;font-size:11px;text-align:center;">
            &copy; ${new Date().getFullYear()} Sujeet Sharma. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeEmailHtml(verifyLink: string, unsubscribeLink: string): string {
  const inner = `
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">Welcome to the Newsletter 🚀</h1>
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">Thank you for subscribing. You will hear from me whenever I publish.</p>
    </td></tr>
    <tr><td style="padding:16px 40px 8px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 12px 0;color:#e2e8f0;font-size:14px;font-weight:600;">What you will receive:</p>
          <ul style="margin:0;padding:0 0 0 20px;color:#cbd5e1;font-size:14px;line-height:1.8;">
            <li>New Blog Posts</li>
            <li>New Projects</li>
            <li>Tutorials</li>
          </ul>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 40px 8px 40px;text-align:center;">
      <p style="margin:0 0 14px 0;color:#94a3b8;font-size:13px;line-height:1.6;">One quick step &mdash; confirm your email to activate your subscription.</p>
      <a href="${verifyLink}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Verify Email</a>
    </td></tr>
    <tr><td style="padding:20px 40px 8px 40px;text-align:center;">
      <a href="${ADMIN_URL}" style="display:inline-block;padding:12px 26px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#e2e8f0;font-size:13px;font-weight:600;text-decoration:none;">Visit Portfolio</a>
    </td></tr>
    <tr><td style="padding:16px 40px 0 40px;text-align:center;">
      <p style="margin:0;color:#64748b;font-size:11px;">Prefer not to receive these emails? <a href="${unsubscribeLink}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>.</p>
    </td></tr>`;
  return emailShell(inner);
}

function verifiedEmailHtml(unsubscribeLink: string): string {
  const inner = `
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;font-size:28px;line-height:56px;text-align:center;margin-bottom:12px;">&#10003;</div>
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:24px;font-weight:700;">You are confirmed!</h1>
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">Your subscription is now active. You will receive updates whenever I publish new blog posts, projects, or tutorials.</p>
    </td></tr>
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <a href="${ADMIN_URL}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Visit Portfolio</a>
    </td></tr>
    <tr><td style="padding:16px 40px 0 40px;text-align:center;">
      <p style="margin:0;color:#64748b;font-size:11px;">You can <a href="${unsubscribeLink}" style="color:#94a3b8;text-decoration:underline;">unsubscribe</a> at any time.</p>
    </td></tr>`;
  return emailShell(inner);
}

function goodbyeEmailHtml(): string {
  const inner = `
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:24px;font-weight:700;">You are unsubscribed</h1>
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">You will no longer receive newsletter emails from me. If this was a mistake, you can always subscribe again from the website.</p>
    </td></tr>
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <a href="${ADMIN_URL}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Visit Portfolio</a>
    </td></tr>`;
  return emailShell(inner);
}

/* ------------------------------- Resend -------------------------------- */

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; reason?: string }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { ok: false, reason: "key_missing" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Resend error", res.status, text);
      return { ok: false, reason: `status_${res.status}:${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend fetch failed", err);
    return { ok: false, reason: `fetch_err:${err instanceof Error ? err.message : String(err)}` };
  }
}

/* ----------------------------- Rate limiting ---------------------------- */

async function checkRateLimit(identifier: string): Promise<boolean> {
  // 5 subscriptions per identifier per hour.
  //
  // NOTE: this check-then-insert is not fully atomic under high concurrency —
  // two near-simultaneous requests can both read a count below the limit and
  // both insert, letting the limit slip by one or two under a burst. For
  // strict correctness, replace this with a single Postgres RPC that does the
  // count-check and insert inside one transaction (e.g. a `plpgsql` function
  // using `SELECT ... FOR UPDATE` or a unique constraint on a bucketed
  // window). Left as-is here since it requires a DB migration.
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await getSupabase()
    .from("newsletter_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .gte("created_at", windowStart);
  if ((count ?? 0) >= 5) return false;

  await getSupabase().from("newsletter_rate_limits").insert({ identifier });

  // Prune old entries opportunistically.
  const pruneBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await getSupabase().from("newsletter_rate_limits").delete().lt("created_at", pruneBefore);
  return true;
}

/* ------------------------------- Handler -------------------------------- */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only allow POST for actual actions — a stray GET (e.g. a link scanner
  // hitting this function directly) should not be able to trigger anything.
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const action = String(body.action || "");

    if (action === "subscribe") {
      const emailRaw = String(body.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(emailRaw)) {
        return json({ error: "Invalid email address.", code: "invalid" }, 400);
      }

      // Rate limit by email + resolved IP.
      const ip = resolveClientIp(req);
      const identifier = `${ip}:${emailRaw}`;
      const allowed = await checkRateLimit(identifier);
      if (!allowed) {
        return json({ error: "Too many attempts. Please try again later.", code: "rate_limited" }, 429);
      }

      // Dedupe — if a row already exists, handle by verification state.
      const { data: existing } = await getSupabase()
        .from("newsletter_subscribers")
        .select("id, verified, unsubscribe_token")
        .eq("email", emailRaw)
        .maybeSingle();

      if (existing) {
        if (existing.verified) {
          return json(
            { error: "You are already subscribed.", code: "duplicate" },
            409
          );
        }
        // Unverified subscriber trying again — resend the verification email
        // with a fresh token so they can complete double opt-in.
        const newVerifyToken = randomToken();
        await getSupabase()
          .from("newsletter_subscribers")
          .update({ verification_token: newVerifyToken })
          .eq("id", existing.id);

        const verifyLink = `${VERIFY_URL}?token=${newVerifyToken}`;
        const unsubscribeLink = `${UNSUBSCRIBE_URL}?token=${existing.unsubscribe_token}`;
        const resent = await sendEmail(
          emailRaw,
          "Welcome to Sujeet Sharma Newsletter 🚀",
          welcomeEmailHtml(verifyLink, unsubscribeLink)
        );

        if (!resent.ok) {
          return json({
            message: "We re-sent your verification email, but it could not be delivered right now. Please try again later.",
            email_sent: false,
          });
        }
        return json({
          message: "You are already subscribed but not verified. We have re-sent your confirmation email — check your inbox.",
          email_sent: true,
        });
      }

      const verificationToken = randomToken();
      const unsubscribeToken = randomToken();

      const { error: insertErr } = await getSupabase().from("newsletter_subscribers").insert({
        email: emailRaw,
        verified: false,
        verification_token: verificationToken,
        unsubscribe_token: unsubscribeToken,
      });

      if (insertErr) {
        if (insertErr.code === "23505") {
          return json({ error: "You are already subscribed.", code: "duplicate" }, 409);
        }
        console.error("Insert failed", insertErr);
        return json({ error: "Could not save your subscription.", code: "unknown" }, 500);
      }

      const verifyLink = `${VERIFY_URL}?token=${verificationToken}`;
      const unsubscribeLink = `${UNSUBSCRIBE_URL}?token=${unsubscribeToken}`;
      const sent = await sendEmail(
        emailRaw,
        "Welcome to Sujeet Sharma Newsletter 🚀",
        welcomeEmailHtml(verifyLink, unsubscribeLink)
      );

      if (!sent.ok) {
        // Row is saved but email failed — surface a soft success so the user retries verify later.
        return json({
          message: "Subscribed, but the welcome email could not be sent. Please try again later.",
          email_sent: false,
        });
      }

      return json({
        message: "Thanks for subscribing! Check your inbox to confirm your email.",
        email_sent: true,
      });
    }

    if (action === "verify") {
      const token = String(body.token || "").trim();
      if (!token) return json({ error: "Invalid verification link." }, 400);

      const { data: row } = await getSupabase()
        .from("newsletter_subscribers")
        .select("id, email, verified, unsubscribe_token")
        .eq("verification_token", token)
        .maybeSingle();

      if (!row) return json({ error: "Invalid or expired verification link." }, 404);

      if (!row.verified) {
        await getSupabase()
          .from("newsletter_subscribers")
          .update({ verified: true, verification_token: "" })
          .eq("id", row.id);

        // Send a confirmation email with the unsubscribe link.
        const unsubscribeLink = `${UNSUBSCRIBE_URL}?token=${row.unsubscribe_token}`;
        await sendEmail(row.email, "You are confirmed — welcome aboard!", verifiedEmailHtml(unsubscribeLink));
      }

      return json({ message: "Your subscription is confirmed. Thank you!" });
    }

    // ------------------------------------------------------------------
    // Unsubscribe is split into two steps to avoid automated email-security
    // scanners / link-prefetchers silently unsubscribing real users just by
    // visiting the unsubscribe URL (RFC 8058-style concern — GET should
    // never itself change state).
    //
    //   1. "unsubscribe_check": validates the token and returns basic info
    //      (e.g. masked email) WITHOUT changing anything. Call this when the
    //      unsubscribe page loads.
    //   2. "unsubscribe_confirm": actually performs the unsubscribe. Call
    //      this only after the user explicitly clicks a confirm button on
    //      the page.
    // ------------------------------------------------------------------

    if (action === "unsubscribe_check") {
      const token = String(body.token || "").trim();
      if (!token) return json({ error: "Invalid unsubscribe link." }, 400);

      const { data: row } = await getSupabase()
        .from("newsletter_subscribers")
        .select("id, email, verified")
        .eq("unsubscribe_token", token)
        .maybeSingle();

      if (!row) return json({ error: "Invalid or expired unsubscribe link." }, 404);

      const [localPart, domain] = row.email.split("@");
      const maskedLocal =
        localPart.length <= 2
          ? localPart[0] + "*"
          : localPart[0] + "*".repeat(localPart.length - 2) + localPart[localPart.length - 1];
      const maskedEmail = `${maskedLocal}@${domain}`;

      return json({
        valid: true,
        already_unsubscribed: !row.verified,
        masked_email: maskedEmail,
      });
    }

    if (action === "unsubscribe_confirm") {
      const token = String(body.token || "").trim();
      if (!token) return json({ error: "Invalid unsubscribe link." }, 400);

      const { data: row } = await getSupabase()
        .from("newsletter_subscribers")
        .select("id, email, verified")
        .eq("unsubscribe_token", token)
        .maybeSingle();

      if (!row) return json({ error: "Invalid or expired unsubscribe link." }, 404);

      if (row.verified) {
        await getSupabase()
          .from("newsletter_subscribers")
          .update({ verified: false })
          .eq("id", row.id);

        // Polite goodbye email — only send it the first time, not on repeat confirms.
        await sendEmail(row.email, "You have been unsubscribed", goodbyeEmailHtml());
      }

      return json({ message: "You have been unsubscribed. We are sorry to see you go!" });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    console.error("welcome-email error", err);
    return json({ error: "Internal server error." }, 500);
  }
});