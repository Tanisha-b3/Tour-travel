import nodemailer from "nodemailer";

const FROM_ADDRESS = process.env.SMTP_USER || "Airventure <no-reply@airventure.com>";
const APP_NAME = "Airventure";
const FRONTEND_URL = process.env.Frontend_URL || "http://localhost:5173";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  if (isSmtpConfigured()) {
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    cachedTransport = {
      sendMail: async (opts) => {
        const preview = nodemailer.createTransport({ jsonTransport: true });
        const info = await preview.sendMail(opts);
        console.log("\n📧 [emailService] (dev / no SMTP) message prepared →");
        console.log(`   To:      ${opts.to}`);
        console.log(`   Subject: ${opts.subject}`);
        if (info.message) {
          const parsed = JSON.parse(info.message);
          console.log(`   From:    ${parsed.from}`);
          console.log(`   Text:    ${(parsed.text || "").slice(0, 240)}${(parsed.text || "").length > 240 ? "…" : ""}`);
        }
        console.log("");
        return { messageId: `dev-${Date.now()}`, envelope: { to: [opts.to] } };
      },
    };
  }
  return cachedTransport;
}

function layout({ title, body, preheader = "" }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#F4F7FD;font-family:'Inter',Helvetica,Arial,sans-serif;color:#0a0f1e;">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F7FD;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #EBF0FA;">
        <tr><td style="background:linear-gradient(135deg,#1E3259 0%,#31487A 55%,#4B6DA8 100%);padding:24px 28px;color:#ffffff;">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:800;letter-spacing:-0.01em;">✈️ ${APP_NAME}</div>
          <div style="opacity:.75;font-size:12px;margin-top:4px;letter-spacing:.2em;text-transform:uppercase;">${title}</div>
        </td></tr>
        <tr><td style="padding:28px;">${body}</td></tr>
        <tr><td style="padding:18px 28px;background:#F4F7FD;border-top:1px solid #EBF0FA;font-size:11px;color:#4B6DA8;line-height:1.6;">
          <div>You are receiving this email because you have an account with ${APP_NAME}.</div>
          <div style="margin-top:6px;">Need help? Reach us at <a style="color:#31487A;" href="mailto:support@airventure.com">support@airventure.com</a></div>
          <div style="margin-top:6px;"><a style="color:#7A99CC;" href="${FRONTEND_URL}">${FRONTEND_URL.replace(/^https?:\/\//, "")}</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:#4B6DA8;font-size:12px;width:42%;">${label}</td>
    <td style="padding:8px 0;color:#0a0f1e;font-size:13px;font-weight:600;text-align:right;">${value}</td>
  </tr>`;
}

function ctaButton(href, label) {
  return `<div style="margin:24px 0 8px;text-align:center;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#1E3259 0%,#31487A 55%,#4B6DA8 100%);color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:700;font-size:13px;letter-spacing:.01em;">${label}</a>
  </div>`;
}

function money(n, currency = "INR") {
  const formatted = Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return currency === "INR" || !currency ? `\u20B9${formatted}` : `${currency} ${formatted}`;
}

async function send({ to, subject, html, text }) {
  try {
    const transport = getTransport();
    const info = await transport.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text: text || subject,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error("[emailService] send failed:", err.message);
    return { ok: false, error: err.message };
  }
}

export async function sendWelcome({ name, email }) {
  if (!email) return { ok: false, error: "missing email" };
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1E3259;">Welcome aboard, ${escapeHtml(name || "traveler")} 👋</h1>
    <p style="margin:0 0 16px;color:#4B6DA8;font-size:14px;line-height:1.6;">
      Your <strong>${APP_NAME}</strong> account is ready. Discover handpicked tours, save your favourites to your wishlist, and book your next adventure in just a few clicks.
    </p>
    ${ctaButton(FRONTEND_URL, "Explore Destinations →")}
    <p style="margin:18px 0 0;color:#4B6DA8;font-size:13px;line-height:1.6;">
      Have a great trip,<br/>— The ${APP_NAME} team
    </p>`;
  return send({
    to: email,
    subject: `Welcome to ${APP_NAME} 🛫`,
    html: layout({ title: "Welcome", body, preheader: "Your Airventure account is ready." }),
  });
}

export async function sendBookingConfirmation({ name, email, tourName, bookingId, total, currency, checkIn, checkOut, guests, paymentStatus }) {
  if (!email) return { ok: false, error: "missing email" };
  const safeName = escapeHtml(name || "traveler");
  const safeTour = escapeHtml(tourName || "your tour");
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1E3259;">Booking confirmed, ${safeName} 🎉</h1>
    <p style="margin:0 0 18px;color:#4B6DA8;font-size:14px;line-height:1.6;">
      Your reservation for <strong>${safeTour}</strong> is locked in. Below are the details of your trip — keep this email for your records.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FD;border:1px solid #EBF0FA;border-radius:12px;padding:14px 18px;margin:8px 0 6px;">
      ${row("Reference", `<span style="font-family:monospace;">#${String(bookingId).slice(-8).toUpperCase()}</span>`)}
      ${row("Check-in", escapeHtml(checkIn || "—"))}
      ${row("Check-out", escapeHtml(checkOut || "—"))}
      ${row("Guests", `${guests || 1}`)}
      ${row("Total paid", `<span style="color:#31487A;">${money(total, currency)}</span>`)}
      ${row("Payment", escapeHtml((paymentStatus || "paid").toUpperCase()))}
    </table>
    ${ctaButton(`${FRONTEND_URL}/my-bookings`, "View My Bookings")}
    <p style="margin:18px 0 0;color:#4B6DA8;font-size:13px;line-height:1.6;">
      You can manage your booking, request changes, or share a review from your dashboard. Need to make changes? Just reply to this email.
    </p>`;
  return send({
    to: email,
    subject: `Booking confirmed — ${safeTour}`,
    html: layout({ title: "Booking Confirmed", body, preheader: `Your ${safeTour} trip is confirmed.` }),
  });
}

export async function sendBookingStatusUpdate({ name, email, tourName, status, bookingId }) {
  if (!email) return { ok: false, error: "missing email" };
  const safeName = escapeHtml(name || "traveler");
  const safeTour = escapeHtml(tourName || "your tour");
  const normalized = String(status || "").toLowerCase();
  const messageMap = {
    confirmed: { msg: "Great news — your booking has been confirmed by our team. Get your bags ready! ✈️", emoji: "✅" },
    pending:   { msg: "Your booking is now pending review. Our team will confirm shortly.", emoji: "⏳" },
    cancelled: { msg: "Your booking has been cancelled as requested. If this was a mistake, contact support to reinstate it.", emoji: "❌" },
  };
  const copy = messageMap[normalized] || { msg: `Booking status updated to <strong>${escapeHtml(normalized)}</strong>.`, emoji: "ℹ️" };
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1E3259;">${copy.emoji} Booking status updated</h1>
    <p style="margin:0 0 16px;color:#4B6DA8;font-size:14px;line-height:1.6;">
      Hi ${safeName}, ${copy.msg}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FD;border:1px solid #EBF0FA;border-radius:12px;padding:14px 18px;margin:8px 0 6px;">
      ${row("Reference", `<span style="font-family:monospace;">#${String(bookingId).slice(-8).toUpperCase()}</span>`)}
      ${row("Tour", safeTour)}
      ${row("New status", `<span style="color:#31487A;text-transform:uppercase;letter-spacing:.05em;">${escapeHtml(normalized || "—")}</span>`)}
    </table>
    ${ctaButton(`${FRONTEND_URL}/my-bookings`, "View My Bookings")}`;
  return send({
    to: email,
    subject: `Booking ${normalized} — ${safeTour}`,
    html: layout({ title: "Booking Updated", body, preheader: `Your booking status is now ${normalized}.` }),
  });
}

export async function sendAdminBookingNotification({ name, email, tourName, bookingId, total, currency, checkIn, checkOut, guests }) {
  if (ADMIN_EMAILS.length === 0) return { ok: false, error: "no admin emails configured" };
  const safeName = escapeHtml(name || "customer");
  const safeTour = escapeHtml(tourName || "N/A");
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1E3259;">📦 New booking received</h1>
    <p style="margin:0 0 18px;color:#4B6DA8;font-size:14px;line-height:1.6;">
      A new booking has been placed on <strong>${APP_NAME}</strong>. Review the details below.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FD;border:1px solid #EBF0FA;border-radius:12px;padding:14px 18px;margin:8px 0 6px;">
      ${row("Reference", `<span style="font-family:monospace;">#${String(bookingId).slice(-8).toUpperCase()}</span>`)}
      ${row("Customer", safeName)}
      ${row("Email", escapeHtml(email || "—"))}
      ${row("Tour", safeTour)}
      ${row("Check-in", escapeHtml(checkIn || "—"))}
      ${row("Check-out", escapeHtml(checkOut || "—"))}
      ${row("Guests", `${guests || 1}`)}
      ${row("Total", `<span style="color:#31487A;">${money(total, currency)}</span>`)}
    </table>
    ${ctaButton(`${FRONTEND_URL}/admin/bookings`, "Manage Bookings")}`;
  return send({
    to: ADMIN_EMAILS.join(","),
    subject: `New booking — ${safeTour} (${money(total, currency)})`,
    html: layout({ title: "New Booking", body, preheader: `${safeName} just booked ${safeTour}.` }),
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
