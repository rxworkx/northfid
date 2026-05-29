import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "Pipnova <noreply@pipnova.com>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Pipnova";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function baseTemplate(title: string, body: string) {
  const year = new Date().getFullYear();
  const logoUrl = `${APP_URL}/media/logo3.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0d0d0d;min-height:100vh">
    <tr><td align="center" style="padding:48px 16px 0">

      <!-- Container -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px">

        <!-- ── LOGO ── -->
        <tr>
          <td align="center" style="padding-bottom:36px">
            <a href="${APP_URL}" style="text-decoration:none;display:inline-block">
              <img
                src="${logoUrl}"
                alt="${APP_NAME}"
                width="140"
                style="height:auto;display:block;border:0;max-width:140px"
              />
            </a>
          </td>
        </tr>

        <!-- ── CARD ── -->
        <tr>
          <td style="background:#141414;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:44px 40px 40px;box-shadow:0 8px 40px rgba(0,0,0,0.6)">

            <!-- Card title -->
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;letter-spacing:-0.3px">${title}</h1>

            <!-- Divider -->
            <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:24px"></div>

            <!-- Body content injected here -->
            ${body}

          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="padding:36px 0 48px">

            <!-- Footer links -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding-bottom:16px">
                  <a href="${APP_URL}/dashboard" style="color:#666;font-size:12px;text-decoration:none;margin:0 10px">Dashboard</a>
                  <span style="color:#333;font-size:12px">|</span>
                  <a href="${APP_URL}/support" style="color:#666;font-size:12px;text-decoration:none;margin:0 10px">Support</a>
                  <span style="color:#333;font-size:12px">|</span>
                  <a href="${APP_URL}/privacy" style="color:#666;font-size:12px;text-decoration:none;margin:0 10px">Privacy</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:10px">
                  <img src="${logoUrl}" alt="${APP_NAME}" width="60" style="height:auto;display:inline-block;border:0;opacity:0.3" />
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="margin:0;font-size:12px;color:#444;line-height:1.6">
                    &copy; ${year} ${APP_NAME}. All rights reserved.<br>
                    <span style="color:#333">You are receiving this email because you have an account on ${APP_NAME}.</span>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

async function sendEmail(payload: Parameters<Resend["emails"]["send"]>[0]) {
  const { data, error } = await getResend().emails.send(payload);
  if (error) {
    console.error("[resend] send failed:", JSON.stringify(error));
    throw new Error(`Resend error: ${error.message}`);
  }
  return data;
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#999;line-height:1.7">
      Hi <strong style="color:#ddd">${firstName}</strong>, your ${APP_NAME} account has been set up.
      Click the button below to create your password and access your account.
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#f07020,#c85010)">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.2px">
            Set your password →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:12px;color:#555;line-height:1.6">Or copy this link into your browser:</p>
    <p style="margin:0 0 28px;font-size:11px;color:#f07020;word-break:break-all;background:#1a1a1a;border:1px solid rgba(240,112,32,0.2);border-radius:8px;padding:10px 12px">${resetUrl}</p>
    <p style="margin:0;font-size:12px;color:#444;line-height:1.6">
      This link expires in <strong style="color:#777">30 days</strong>.
      If you did not expect this email, you can safely ignore it.
    </p>
  `;

  return sendEmail({
    from: FROM,
    to,
    subject: `Set your ${APP_NAME} password`,
    html: baseTemplate(`Welcome to ${APP_NAME}`, body),
  });
}

export async function sendNotificationEmail(to: string, firstName: string, title: string, body: string, href: string) {
  const actionUrl = `${APP_URL}${href.startsWith("/") ? href : "/" + href}`;

  const htmlBody = `
    ${firstName ? `<p style="margin:0 0 8px;font-size:15px;color:#999;line-height:1.7">Hi <strong style="color:#ddd">${firstName}</strong>,</p>` : ""}
    <p style="margin:0 0 28px;font-size:15px;color:#999;line-height:1.7">${body}</p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#f07020,#c85010)">
          <a href="${actionUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.2px">
            View in dashboard →
          </a>
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    from: FROM,
    to,
    subject: title,
    html: baseTemplate(title, htmlBody),
  });
}

export async function sendForgotPasswordEmail(to: string, firstName: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#999;line-height:1.7">
      Hi <strong style="color:#ddd">${firstName}</strong>, we received a request to reset your ${APP_NAME} password.
      Click the button below to choose a new one.
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#f07020,#c85010)">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.2px">
            Reset password →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:12px;color:#555;line-height:1.6">Or copy this link into your browser:</p>
    <p style="margin:0 0 28px;font-size:11px;color:#f07020;word-break:break-all;background:#1a1a1a;border:1px solid rgba(240,112,32,0.2);border-radius:8px;padding:10px 12px">${resetUrl}</p>
    <p style="margin:0;font-size:12px;color:#444;line-height:1.6">
      This link expires in <strong style="color:#777">1 hour</strong>.
      If you didn't request a reset, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    from: FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: baseTemplate("Reset your password", body),
  });
}
