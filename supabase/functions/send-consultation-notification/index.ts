// Supabase Edge Function: send-consultation-notification
// Triggered by: Supabase Database Webhook on INSERT into public.consultations
// Destination: Admin Gmail Inbox via Resend API
//
// Required Edge Function Secrets (configured in Supabase Dashboard):
//   - WEBHOOK_SECRET: Secret token to authenticate incoming Database Webhook requests
//   - RESEND_API_KEY: Resend API Key (re_...)
//   - ADMIN_NOTIFICATION_EMAIL: Your destination email address (e.g. your Gmail)
//   - EMAIL_FROM: Verified sender email (e.g. "Portfolio <notifications@yourdomain.com>" or "onboarding@resend.dev")
//
// Optional Secrets:
//   - SITE_URL: Your production portfolio URL (e.g. "https://yourportfolio.com") to link to Admin Panel

// Declare Deno runtime global for environments without Deno typings
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface ConsultationRecord {
  id?: string;
  full_name?: string;
  email?: string;
  company?: string | null;
  service?: string;
  budget?: string | null;
  timeline?: string | null;
  message?: string;
  status?: string;
  created_at?: string;
}

interface DatabaseWebhookPayload {
  type: string;
  table: string;
  schema: string;
  record: ConsultationRecord;
  old_record?: ConsultationRecord | null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Escapes user-supplied content to prevent HTML/XSS injection in emails.
 */
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formats ISO timestamp into a human-friendly string.
 */
function formatSubmissionDate(dateString?: string): string {
  try {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }) + " UTC";
  } catch {
    return dateString || "Recently";
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed. Only POST is supported." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Mandatory Webhook Secret Authentication
    const expectedWebhookSecret = Deno.env.get("WEBHOOK_SECRET");
    if (!expectedWebhookSecret) {
      console.error(
        "WEBHOOK_SECRET secret is not configured in Supabase Edge Function Secrets."
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: WEBHOOK_SECRET is not configured.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const incomingSecret = req.headers.get("x-webhook-secret");
    if (!incomingSecret || incomingSecret !== expectedWebhookSecret) {
      console.warn("Unauthorized webhook attempt: invalid or missing x-webhook-secret header.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Invalid or missing webhook secret.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse and Validate Webhook Payload
    let payload: DatabaseWebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, table, schema, record } = payload || {};

    // Validate table & schema
    if (table !== "consultations" || schema !== "public") {
      console.warn(`Ignored event from unexpected table/schema: ${schema}.${table}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid table or schema. Expected public.consultations, got ${schema}.${table}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strictly process INSERT events only (prevent sending emails on updates or deletes)
    if (type !== "INSERT") {
      console.log(`Ignored event type: ${type}. Only INSERT triggers email notifications.`);
      return new Response(
        JSON.stringify({
          success: true,
          ignored: true,
          message: `Ignored event '${type}'. Notifications are sent only on new consultations (INSERT).`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!record || typeof record !== "object") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing consultation record in webhook payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Retrieve Server-Side Secrets
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminNotificationEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "onboarding@resend.dev";
    const rawSiteUrl = Deno.env.get("SITE_URL") || Deno.env.get("ADMIN_URL") || "";

    if (!resendApiKey) {
      console.error(
        "RESEND_API_KEY secret is not set in Supabase Edge Function Secrets. Email cannot be dispatched."
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: RESEND_API_KEY secret is missing.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminNotificationEmail) {
      console.error(
        "ADMIN_NOTIFICATION_EMAIL secret is not set in Supabase Edge Function Secrets. Destination email is unknown."
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: ADMIN_NOTIFICATION_EMAIL secret is missing.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Sanitize and Prepare Consultation Fields
    const clientName = (record.full_name || "").trim() || "Prospective Client";
    const clientEmail = (record.email || "").trim();
    const clientCompany = (record.company || "").trim() || "Not provided";
    const clientService = (record.service || "").trim() || "General Inquiry";
    const clientBudget = (record.budget || "").trim() || "Not provided";
    const clientTimeline = (record.timeline || "").trim() || "Not provided";
    const clientMessage = (record.message || "").trim();
    const submissionDate = formatSubmissionDate(record.created_at);

    // Escaped variables for safe HTML inclusion
    const safeName = escapeHtml(clientName);
    const safeEmail = escapeHtml(clientEmail);
    const safeCompany = escapeHtml(clientCompany);
    const safeService = escapeHtml(clientService);
    const safeBudget = escapeHtml(clientBudget);
    const safeTimeline = escapeHtml(clientTimeline);
    const safeMessageHtml = escapeHtml(clientMessage).replace(/\r?\n/g, "<br/>");
    const safeDate = escapeHtml(submissionDate);

    // Subject line
    const emailSubject = clientService && clientService !== "General Inquiry"
      ? `New Consultation Request — ${clientService}`
      : "New Consultation Request";

    // 5. Admin Panel URL (only include if a reliable URL is configured)
    let adminButtonHtml = "";
    const cleanSiteUrl = rawSiteUrl.trim().replace(/\/+$/, "");
    if (cleanSiteUrl && (cleanSiteUrl.startsWith("http://") || cleanSiteUrl.startsWith("https://"))) {
      const adminConsultationsUrl = `${cleanSiteUrl}/admin/consultations`;
      adminButtonHtml = `
        <div style="margin-top: 32px; text-align: center;">
          <a href="${escapeHtml(adminConsultationsUrl)}" 
             style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 13px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            VIEW IN ADMIN PANEL &rarr;
          </a>
        </div>
      `;
    }

    // 6. Build Clean, Responsive HTML Email Template
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b140e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5ece7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b140e; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #132419; border: 1px solid #1f3a29; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #10b981 0%, #34d399 50%, #059669 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #1f3a29;">
              <div style="font-size: 11px; font-family: 'Courier New', Courier, monospace; letter-spacing: 2px; text-transform: uppercase; color: #34d399; font-weight: 700; margin-bottom: 8px;">
                // DESIGN INQUIRY NOTIFICATION
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                New Consultation Request
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #9bb3a4; line-height: 1.5;">
                A new consultation request has been submitted through your portfolio.
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px 32px;">
              
              <!-- Client Details Block -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #7a9484; font-weight: 600; width: 34%;">Client:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 700;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #7a9484; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #34d399; font-weight: 600;">
                    <a href="mailto:${safeEmail}" style="color: #34d399; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #7a9484; font-weight: 600;">Company / Brand:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #e5ece7;">${safeCompany}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #7a9484; font-weight: 600;">Service Requested:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 700;">
                    <span style="display: inline-block; background-color: #1a3324; color: #34d399; padding: 4px 10px; border-radius: 6px; font-size: 12px; border: 1px solid #234631;">
                      ${safeService}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #7a9484; font-weight: 600;">Approx. Budget:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #e5ece7;">${safeBudget}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #7a9484; font-weight: 600;">Timeline:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #e5ece7;">${safeTimeline}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #7a9484; font-weight: 600;">Submitted:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #9bb3a4; font-family: 'Courier New', Courier, monospace;">${safeDate}</td>
                </tr>
              </table>

              <!-- Project Message Box -->
              <div style="margin-top: 16px; background-color: #0d1b12; border: 1px solid #1f3a29; border-radius: 12px; padding: 20px;">
                <div style="font-size: 11px; font-family: 'Courier New', Courier, monospace; letter-spacing: 1.5px; text-transform: uppercase; color: #7a9484; font-weight: 700; margin-bottom: 10px;">
                  Project Details / Message
                </div>
                <div style="font-size: 14px; color: #e5ece7; line-height: 1.6; white-space: pre-wrap;">${safeMessageHtml}</div>
              </div>

              ${adminButtonHtml}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; border-top: 1px solid #1f3a29; text-align: center; font-size: 12px; color: #627b6c;">
              This notification was generated automatically by your portfolio backend via Supabase Database Webhook &amp; Resend.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Plain text fallback
    const plainText = `
NEW CONSULTATION REQUEST

Client: ${clientName}
Email: ${clientEmail}
Company / Brand: ${clientCompany}
Service: ${clientService}
Approximate Budget: ${clientBudget}
Timeline: ${clientTimeline}
Submitted: ${submissionDate}

Project Details:
----------------------------------------
${clientMessage}
----------------------------------------

"A new consultation request has been submitted through your portfolio."
${cleanSiteUrl ? `\nView in Admin Panel: ${cleanSiteUrl}/admin/consultations\n` : ""}
    `.trim();

    // 7. Dispatch Email via Resend API
    console.log(`Dispatching consultation notification email to: ${adminNotificationEmail}`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [adminNotificationEmail],
        reply_to: clientEmail ? [clientEmail] : undefined,
        subject: emailSubject,
        html: htmlEmail,
        text: plainText,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error(
        `Resend API returned error (HTTP ${resendResponse.status}):`,
        errorText
      );
      // Return structured response with diagnostics without exposing secrets
      return new Response(
        JSON.stringify({
          success: false,
          error: "Resend email delivery failed.",
          providerStatusCode: resendResponse.status,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();
    console.log("Consultation notification email delivered to Resend. Resend Email ID:", resendData?.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData?.id || null,
        consultationId: record.id || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unhandled exception in send-consultation-notification function:", message);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Edge Function error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
