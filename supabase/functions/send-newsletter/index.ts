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

const UNSUBSCRIBE_URL = `${SITE_URL}/newsletter/unsubscribe`;
const BLOG_URL = `${SITE_URL}/blog`;
// Resend's batch endpoint accepts up to 100 emails per call.
const EMAIL_BATCH_LIMIT = 100;

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ------------------------------ Email HTML ------------------------------ */

function blogEmailHtml(opts: {
  title: string;
  excerpt: string;
  coverImage: string;
  readUrl: string;
  publishedAt: string;
  readTime: number;
  unsubscribeLink: string;
}): string {
  const dateStr = opts.publishedAt
    ? new Date(opts.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const coverBlock = opts.coverImage
    ? `<tr><td style="padding:8px 40px 20px 40px;">
        <img src="${opts.coverImage}" alt="${opts.title}" style="width:100%;max-width:480px;border-radius:14px;display:block;border:1px solid rgba(255,255,255,0.08);" />
       </td></tr>`
    : "";
  const meta = [dateStr, opts.readTime ? `${opts.readTime} min read` : ""].filter(Boolean).join(" &bull; ");

  const inner = `
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <div style="display:inline-block;padding:8px 16px;border-radius:999px;background:rgba(59,130,246,0.15);color:#60a5fa;font-size:12px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;">New Blog Post</div>
    </td></tr>
    <tr><td style="padding:12px 40px 8px 40px;text-align:center;">
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">${opts.title}</h1>
      <p style="margin:0;color:#94a3b8;font-size:12px;">${meta}</p>
    </td></tr>
    ${coverBlock}
    <tr><td style="padding:8px 40px 20px 40px;">
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">${opts.excerpt}</p>
    </td></tr>
    <tr><td style="padding:8px 40px 24px 40px;text-align:center;">
      <a href="${opts.readUrl}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Read More</a>
    </td></tr>
    <tr><td style="padding:16px 40px 0 40px;text-align:center;">
      <p style="margin:0;color:#64748b;font-size:11px;">You are receiving this because you subscribed. <a href="${opts.unsubscribeLink}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>.</p>
    </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;min-width:100%;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);overflow:hidden;">
        <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
          <div style="display:inline-block;padding:6px 14px;border-radius:999px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:12px;font-weight:600;letter-spacing:0.3px;">SUJEET SHARMA</div>
        </td></tr>
        ${inner}
        <tr><td style="padding:24px 40px 40px 40px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0 0 12px 0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
            <a href="${SITE_URL}" style="color:#60a5fa;text-decoration:none;">sujeetsharma.in</a>
            &nbsp;&bull;&nbsp;
            <a href="https://github.com/" style="color:#60a5fa;text-decoration:none;">GitHub</a>
            &nbsp;&bull;&nbsp;
            <a href="https://www.linkedin.com/" style="color:#60a5fa;text-decoration:none;">LinkedIn</a>
            &nbsp;&bull;&nbsp;
            <a href="https://x.com/" style="color:#60a5fa;text-decoration:none;">X</a>
          </p>
          <p style="margin:0;color:#64748b;font-size:11px;text-align:center;">&copy; ${new Date().getFullYear()} Sujeet Sharma. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ------------------------------- Resend -------------------------------- */

/**
 * Sends one personalized email per recipient using Resend's batch endpoint
 * (POST /emails/batch). Each recipient gets their OWN `to` address and their
 * OWN unsubscribe link (built from their own token) — no BCC, so there's no
 * risk of leaking another subscriber's email address, and no risk of one
 * subscriber's unsubscribe link accidentally unsubscribing someone else.
 */
async function sendBatchEmails(
  recipients: { email: string; unsubscribeToken: string }[],
  subject: string,
  buildHtml: (unsubscribeLink: string) => string
): Promise<{ sent: number; failed: number }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { sent: 0, failed: recipients.length };
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += EMAIL_BATCH_LIMIT) {
    const chunk = recipients.slice(i, i + EMAIL_BATCH_LIMIT);

    const emails = chunk.map((r) => {
      const unsubscribeLink = `${UNSUBSCRIBE_URL}?token=${r.unsubscribeToken}`;
      return {
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [r.email],
        subject,
        html: buildHtml(unsubscribeLink),
      };
    });

    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emails),
      });

      if (res.ok) {
        sent += chunk.length;
      } else {
        const text = await res.text();
        console.error("Resend batch error", res.status, text);
        failed += chunk.length;
      }
    } catch (err) {
      console.error("Resend batch fetch failed", err);
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

/* ------------------------------- Handler -------------------------------- */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    // Allow triggering by slug (preferred) or by a full post object.
    let post: {
      title: string;
      slug: string;
      excerpt: string;
      cover_image: string;
      published_at: string;
      read_time: number;
    } | null = null;

    if (body.slug) {
      const { data } = await getSupabase()
        .from("blog_posts")
        .select("title, slug, excerpt, cover_image, published_at, read_time")
        .eq("slug", String(body.slug))
        .maybeSingle();
      post = data as typeof post;
    } else if (body.post && typeof body.post === "object") {
      post = body.post as typeof post;
    }

    if (!post || !post.title || !post.slug) {
      return json({ error: "Blog post not found." }, 404);
    }

    const { data: subs } = await getSupabase()
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token")
      .eq("verified", true);

    const recipients = (subs ?? []) as { email: string; unsubscribe_token: string }[];
    if (recipients.length === 0) {
      return json({ message: "No verified subscribers to notify.", sent: 0, failed: 0 });
    }

    const readUrl = `${BLOG_URL}/${post.slug}`;
    const result = await sendBatchEmails(
      recipients.map((r) => ({ email: r.email, unsubscribeToken: r.unsubscribe_token })),
      `New post: ${post.title}`,
      (unsubscribeLink) =>
        blogEmailHtml({
          title: post!.title,
          excerpt: post!.excerpt || "I just published a new article. Read it on the blog.",
          coverImage: post!.cover_image || "",
          readUrl,
          publishedAt: post!.published_at || new Date().toISOString(),
          readTime: post!.read_time || 0,
          unsubscribeLink,
        })
    );

    return json({
      message: `Newsletter sent to ${result.sent} subscriber(s).`,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (err) {
    console.error("send-newsletter error", err);
    return json({ error: "Internal server error." }, 500);
  }
});