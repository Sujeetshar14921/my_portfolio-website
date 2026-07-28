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

const VERIFY_LEAD_URL = `${SITE_URL}/verify-email`;
const MEETING_URL = `${SITE_URL}/meeting`;

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
    if (_supabase) return _supabase;
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    _supabase = createClient(url, key, { auth: { persistSession: false } });
    return _supabase;
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function randomToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function logActivity(opts: {
    lead_id?: string | null;
    meeting_id?: string | null;
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
}) {
    await getSupabase().from("activity_logs").insert({
        lead_id: opts.lead_id ?? null,
        meeting_id: opts.meeting_id ?? null,
        type: opts.type,
        title: opts.title,
        description: opts.description ?? null,
        metadata: opts.metadata ?? {},
    });
}

/* ------------------------------ Email HTML ------------------------------ */

function crmEmailShell(innerHtml: string, subject: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;min-width:100%;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
        <tr><td style="padding:32px 40px 8px 40px;text-align:center;">
          <div style="display:inline-block;padding:8px 16px;border-radius:999px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.3px;">SUJEET SHARMA</div>
        </td></tr>
        ${innerHtml}
        <tr><td style="padding:24px 40px 40px 40px;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
            <a href="${SITE_URL}" style="color:#60a5fa;text-decoration:none;">sujeetsharma.in</a>
          </p>
          <p style="margin:8px 0 0 0;color:#64748b;font-size:11px;text-align:center;">
            &copy; ${new Date().getFullYear()} Sujeet Sharma. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function leadVerificationEmailHtml(name: string, verifyLink: string): string {
    return crmEmailShell(`
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:24px;font-weight:700;">Verify Your Email</h1>
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">Hi ${name}, thanks for reaching out! Please confirm your email address so I can review your inquiry.</p>
    </td></tr>
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <a href="${verifyLink}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Verify Email</a>
    </td></tr>
    <tr><td style="padding:16px 40px 0 40px;text-align:center;">
      <p style="margin:0;color:#64748b;font-size:11px;">If you didn't submit this form, you can safely ignore this email.</p>
    </td></tr>
  `, "Verify Your Email");
}

function meetingInviteEmailHtml(opts: {
    recipientName: string;
    title: string;
    agenda: string;
    dateStr: string;
    timeStr: string;
    duration: number;
    joinLink: string;
    gcalLink: string;
    icsLink: string;
}): string {
    return crmEmailShell(`
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:24px;font-weight:700;">Meeting Invitation</h1>
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">Hi ${opts.recipientName}, you've been invited to a meeting.</p>
    </td></tr>
    <tr><td style="padding:16px 40px 8px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 8px 0;color:#e2e8f0;font-size:16px;font-weight:600;">${opts.title}</p>
          ${opts.agenda ? `<p style="margin:0 0 16px 0;color:#94a3b8;font-size:14px;line-height:1.6;">${opts.agenda}</p>` : ""}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#64748b;font-size:12px;padding:4px 0;">Date</td><td style="color:#cbd5e1;font-size:13px;text-align:right;padding:4px 0;">${opts.dateStr}</td></tr>
            <tr><td style="color:#64748b;font-size:12px;padding:4px 0;">Time</td><td style="color:#cbd5e1;font-size:13px;text-align:right;padding:4px 0;">${opts.timeStr}</td></tr>
            <tr><td style="color:#64748b;font-size:12px;padding:4px 0;">Duration</td><td style="color:#cbd5e1;font-size:13px;text-align:right;padding:4px 0;">${opts.duration} min</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 40px 8px 40px;text-align:center;">
      <a href="${opts.joinLink}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Join Meeting</a>
    </td></tr>
    <tr><td style="padding:12px 40px 8px 40px;text-align:center;">
      <a href="${opts.gcalLink}" style="display:inline-block;padding:10px 22px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#e2e8f0;font-size:12px;font-weight:600;text-decoration:none;margin:0 4px;">Add to Google Calendar</a>
      <a href="${opts.icsLink}" style="display:inline-block;padding:10px 22px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#e2e8f0;font-size:12px;font-weight:600;text-decoration:none;margin:0 4px;">Download .ics</a>
    </td></tr>
  `, "Meeting Invitation");
}

function proposalEmailHtml(name: string, proposalContent: string): string {
    return crmEmailShell(`
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:24px;font-weight:700;">Project Proposal</h1>
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">Hi ${name}, following up on our discussion — here's my proposal.</p>
    </td></tr>
    <tr><td style="padding:16px 40px 8px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;">
        <tr><td style="padding:20px 24px;color:#cbd5e1;font-size:14px;line-height:1.7;">${proposalContent.replace(/\n/g, '<br />')}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 40px 8px 40px;text-align:center;">
      <a href="${SITE_URL}/contact" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Discuss Next Steps</a>
    </td></tr>
  `, "Project Proposal");
}

function followUpEmailHtml(name: string, content: string): string {
    return crmEmailShell(`
    <tr><td style="padding:24px 40px 8px 40px;text-align:center;">
      <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:24px;font-weight:700;">Following Up</h1>
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">Hi ${name},</p>
    </td></tr>
    <tr><td style="padding:16px 40px 8px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;">
        <tr><td style="padding:20px 24px;color:#cbd5e1;font-size:14px;line-height:1.7;">${content.replace(/\n/g, '<br />')}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 40px 8px 40px;text-align:center;">
      <a href="${SITE_URL}/contact" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Reply Here</a>
    </td></tr>
  `, "Following Up");
}

/* ------------------------------- Resend -------------------------------- */

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not configured");
        return false;
    }
    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [to], subject, html }),
        });
        if (!res.ok) {
            const text = await res.text();
            console.error("Resend error", res.status, text);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Resend fetch failed", err);
        return false;
    }
}

/* --------------------------- ICS generation ----------------------------- */

function generateICS(opts: { title: string; agenda: string; dateStr: string; timeStr: string; duration: number; meetingUrl: string }): string {
    const dt = new Date(`${opts.dateStr}T${opts.timeStr}:00`);
    const end = new Date(dt.getTime() + opts.duration * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Sujeet Sharma//Meeting//EN",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@sujeetsharma.in`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(dt)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${opts.title}`,
        `DESCRIPTION:${(opts.agenda || "").replace(/\n/g, "\\n")}`,
        `LOCATION:${opts.meetingUrl}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
}

/* ------------------------------- Handler -------------------------------- */

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

    try {
        const body = await req.json().catch(() => ({} as Record<string, unknown>));
        const action = String(body.action || "");

        /* ---- Verify lead email ---- */
        if (action === "verify_lead") {
            const token = String(body.token || "").trim();

            if (!token) {
                return json(
                    {
                        ok: false,
                        error: "Verification token is missing.",
                    },
                    400
                );
            }

            const { data: lead, error: findError } = await getSupabase()
                .from("contact_submissions")
                .select("*")
                .eq("verification_token", token)
                .maybeSingle();

            if (findError) {
                console.error("Find Lead Error:", findError);

                return json(
                    {
                        ok: false,
                        error: findError.message,
                    },
                    500
                );
            }

            if (!lead) {
                return json(
                    {
                        ok: false,
                        error: "Invalid or expired verification link.",
                    },
                    404
                );
            }

            if (lead.email_verified) {
                return json({
                    ok: true,
                    message: "Email already verified.",
                    name: lead.name,
                });
            }

            const { error: updateError } = await getSupabase()
                .from("contact_submissions")
                .update({
                    email_verified: true,
                    verification_token: null,
                    status: "verified",
                })
                .eq("id", lead.id);

            if (updateError) {
                console.error("Update Error:", updateError);

                return json(
                    {
                        ok: false,
                        error: updateError.message,
                    },
                    500
                );
            }

            await logActivity({
                lead_id: lead.id,
                type: "verification",
                title: "Email Verified",
                description: `${lead.name} verified their email address.`,
            });

            return json({
                ok: true,
                message: "Email verified successfully.",
                name: lead.name,
            });
        }

        /* ---- Send lead verification email ---- */
        if (action === "send_lead_verification") {
            const leadId = String(body.lead_id || "");
            const token = String(body.token || "");

            let lead: { id: string; name: string; email: string; email_verified: boolean } | null = null;

            if (leadId) {
                const r = await getSupabase()
                    .from("contact_submissions")
                    .select("id, name, email, email_verified")
                    .eq("id", leadId)
                    .maybeSingle();
                lead = r.data;
            } else if (token) {
                const r = await getSupabase()
                    .from("contact_submissions")
                    .select("id, name, email, email_verified, verification_token")
                    .eq("verification_token", token)
                    .maybeSingle();
                lead = r.data;
            }

            if (!lead) return json({ error: "Lead not found." }, 404);
            if (lead.email_verified) return json({ error: "This lead is already verified." }, 400);

            // Use existing token or generate a new one
            const useToken = token || randomToken();
            await getSupabase()
                .from("contact_submissions")
                .update({ verification_token: useToken, verification_sent_at: new Date().toISOString() })
                .eq("id", lead.id);

            const verifyLink = `${VERIFY_LEAD_URL}?token=${useToken}`;
            const sent = await sendEmail(lead.email, "Verify Your Email — Sujeet Sharma", leadVerificationEmailHtml(lead.name, verifyLink));

            await logActivity({
                lead_id: lead.id,
                type: "email_sent",
                title: "Verification Email Sent",
                description: `Verification email sent to ${lead.email}`,
            });

            return json({ ok: true, email_sent: sent });
        }

        /* ---- Schedule meeting + send invite ---- */
        if (action === "schedule_meeting") {
            const leadId = String(body.lead_id || "");
            const title = String(body.title || "").trim();
            const agenda = String(body.agenda || "").trim();
            const meetingType = String(body.meeting_type || "one_on_one");
            const meetingDate = String(body.meeting_date || "");
            const meetingTime = String(body.meeting_time || "");
            const duration = Number(body.duration || 30);
            const participants = Array.isArray(body.participants) ? body.participants : [];

            if (!title || !meetingDate || !meetingTime) {
                return json({ error: "Title, date, and time are required." }, 400);
            }

            const secureToken = crypto.randomUUID();
            const meetingUrl = `${MEETING_URL}/${secureToken}`;

            const { data: meeting, error: meetErr } = await getSupabase()
                .from("meetings")
                .insert({
                    lead_id: leadId || null,
                    title,
                    agenda,
                    meeting_type: meetingType,
                    meeting_url: meetingUrl,
                    secure_token: secureToken,
                    meeting_date: meetingDate,
                    meeting_time: meetingTime,
                    duration,
                    status: "scheduled",
                })
                .select()
                .single();

            if (meetErr || !meeting) {
                console.error("Meeting insert failed", meetErr);
                return json({ error: "Could not create meeting." }, 500);
            }

            // Insert participants
            if (participants.length > 0) {
                const rows = participants.map((p: { email: string; name?: string }) => ({
                    meeting_id: meeting.id,
                    email: String(p.email),
                    name: p.name ? String(p.name) : null,
                }));
                await getSupabase().from("meeting_participants").insert(rows);
            }

            // Update lead meeting status
            if (leadId) {
                await getSupabase()
                    .from("contact_submissions")
                    .update({ meeting_status: "scheduled", status: "meeting_scheduled" })
                    .eq("id", leadId);
            }

            // Build calendar links
            const dt = new Date(`${meetingDate}T${meetingTime}:00`);
            const dtEnd = new Date(dt.getTime() + duration * 60000);
            const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${dtEnd.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}&details=${encodeURIComponent(agenda)}`;

            const icsContent = generateICS({ title, agenda, dateStr: meetingDate, timeStr: meetingTime, duration, meetingUrl });

            // Send invite emails
            const dateStr = new Date(meetingDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
            const timeStr = meetingTime;
            let emailsSent = 0;
            let emailsFailed = 0;

            for (const p of participants) {
                const sent = await sendEmail(
                    String(p.email),
                    `Meeting Invitation: ${title}`,
                    meetingInviteEmailHtml({
                        recipientName: p.name || String(p.email),
                        title,
                        agenda,
                        dateStr,
                        timeStr,
                        duration,
                        joinLink: meetingUrl,
                        gcalLink,
                        icsLink: `${meetingUrl}?ics=1`,
                    })
                );
                sent ? emailsSent++ : emailsFailed++;
            }

            await logActivity({
                lead_id: leadId || null,
                meeting_id: meeting.id,
                type: "meeting_scheduled",
                title: `Meeting Scheduled: ${title}`,
                description: `Scheduled for ${dateStr} at ${timeStr} (${duration} min). ${emailsSent} invite(s) sent.`,
                metadata: { meeting_url: meetingUrl, ics: icsContent },
            });

            return json({ ok: true, meeting, emails_sent: emailsSent, emails_failed: emailsFailed });
        }

        /* ---- Get ICS file for a meeting ---- */
        if (action === "get_ics") {
            const meetingId = String(body.meeting_id || "");
            if (!meetingId) return json({ error: "Meeting ID required." }, 400);

            const { data: meeting } = await getSupabase()
                .from("meetings")
                .select("title, agenda, meeting_date, meeting_time, duration, meeting_url")
                .eq("id", meetingId)
                .maybeSingle();

            if (!meeting) return json({ error: "Meeting not found." }, 404);

            const ics = generateICS({
                title: meeting.title,
                agenda: meeting.agenda || "",
                dateStr: meeting.meeting_date,
                timeStr: meeting.meeting_time,
                duration: meeting.duration,
                meetingUrl: meeting.meeting_url,
            });
            return json({ ics });
        }

        /* ---- Send proposal ---- */
        if (action === "send_proposal") {
            const leadId = String(body.lead_id || "");
            const content = String(body.content || "").trim();

            if (!leadId || !content) return json({ error: "Lead ID and content are required." }, 400);

            const { data: lead } = await getSupabase()
                .from("contact_submissions")
                .select("id, name, email")
                .eq("id", leadId)
                .maybeSingle();

            if (!lead) return json({ error: "Lead not found." }, 404);

            const sent = await sendEmail(lead.email, "Project Proposal — Sujeet Sharma", proposalEmailHtml(lead.name, content));

            await getSupabase()
                .from("contact_submissions")
                .update({ status: "proposal_sent" })
                .eq("id", leadId);

            await logActivity({
                lead_id: leadId,
                type: "proposal_sent",
                title: "Proposal Sent",
                description: `Proposal email sent to ${lead.email}`,
                metadata: { content, email_sent: sent },
            });

            return json({ ok: true, email_sent: sent });
        }

        /* ---- Send follow-up ---- */
        if (action === "send_followup") {
            const leadId = String(body.lead_id || "");
            const content = String(body.content || "").trim();

            if (!leadId || !content) return json({ error: "Lead ID and content are required." }, 400);

            const { data: lead } = await getSupabase()
                .from("contact_submissions")
                .select("id, name, email")
                .eq("id", leadId)
                .maybeSingle();

            if (!lead) return json({ error: "Lead not found." }, 404);

            const sent = await sendEmail(lead.email, "Following Up — Sujeet Sharma", followUpEmailHtml(lead.name, content));

            await logActivity({
                lead_id: leadId,
                type: "follow_up_sent",
                title: "Follow-up Sent",
                description: `Follow-up email sent to ${lead.email}`,
                metadata: { content, email_sent: sent },
            });

            return json({ ok: true, email_sent: sent });
        }

        /* ---- Complete meeting ---- */
        if (action === "complete_meeting") {
            const meetingId = String(body.meeting_id || "");
            if (!meetingId) return json({ error: "Meeting ID required." }, 400);

            const { data: meeting } = await getSupabase()
                .from("meetings")
                .select("id, lead_id, title")
                .eq("id", meetingId)
                .maybeSingle();

            if (!meeting) return json({ error: "Meeting not found." }, 404);

            await getSupabase().from("meetings").update({ status: "completed" }).eq("id", meetingId);

            if (meeting.lead_id) {
                await getSupabase()
                    .from("contact_submissions")
                    .update({ meeting_status: "completed", status: "meeting_completed" })
                    .eq("id", meeting.lead_id);
            }

            await logActivity({
                lead_id: meeting.lead_id,
                meeting_id: meeting.id,
                type: "meeting_completed",
                title: `Meeting Completed: ${meeting.title}`,
            });

            return json({ ok: true });
        }

        return json({ error: "Unknown action." }, 400);
    } catch (err) {
        console.error("crm-api error", err);
        return json({ error: "Internal server error." }, 500);
    }
});
