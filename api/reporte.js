// ============================================================
//  Sueldazo · Envío del reporte por correo (Vercel Serverless Function)
//  Envía el "Reporte MAGI" al correo del usuario vía Resend.
//
//  Requiere variables de entorno en Vercel:
//    RESEND_API_KEY            (obligatoria · gratis en resend.com)
//    RESEND_FROM   (opcional)  remitente verificado, ej "SUELDAZO MAGI <reporte@tudominio.com>"
//                              por defecto usa el remitente de pruebas de Resend.
//
//  POST /api/reporte  { email, rol, seniority, pais, modalidad,
//                       salarioLocal, moneda, medianUSD, userUSD, pct }
// ============================================================

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("es-ES");
const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function patronDe(pct) {
  if (pct <= -12)
    return { key: "azul", titulo: "PATRÓN AZUL", estado: "SALARIO BAJO EL UMBRAL", color: "#F0321E",
      msg: `Estás <b>~${Math.abs(pct)}% por debajo</b> de la mediana de tu perfil. Tienes evidencia para negociar un ajuste.` };
  if (pct >= 12)
    return { key: "verde", titulo: "PATRÓN VERDE", estado: "SOBRE EL UMBRAL", color: "#35FFA0",
      msg: `Estás <b>~${pct}% por encima</b> de la mediana de tu perfil. Posición fuerte.` };
  return { key: "naranja", titulo: "PATRÓN NARANJA", estado: "DENTRO DE PARÁMETROS", color: "#FF7A18",
    msg: "Tu sueldo está <b>dentro de parámetros</b> para tu perfil." };
}

function plantillaMAGI(d) {
  const p = patronDe(Number(d.pct) || 0);
  const AMBER = "#FF7A18", AMBER_HI = "#FFB300", DIM = "#8a4d16", BG = "#050503", PANEL = "#0a0a07";
  const mono = "'Courier New', Consolas, monospace";
  const hazard = `background-image:repeating-linear-gradient(-45deg,${p.color} 0 10px,#0a0a07 10px 20px);height:10px;line-height:10px;font-size:0;`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BG};border:1px solid rgba(255,122,24,.35);font-family:${mono};color:${AMBER};">
        <tr><td style="${hazard}">&nbsp;</td></tr>
        <tr><td style="padding:22px 28px 6px;">
          <div style="font-size:12px;letter-spacing:3px;color:${DIM};">NERV // SUELDAZO — SISTEMA MAGI</div>
          <div style="font-size:22px;letter-spacing:2px;color:${AMBER_HI};margin-top:6px;">REPORTE SALARIAL INDIVIDUAL</div>
        </td></tr>
        <tr><td style="padding:8px 28px 0;color:${AMBER};font-size:14px;line-height:1.6;">
          Hola. El sistema MAGI analizó tu perfil y este es tu resultado.
        </td></tr>

        <tr><td style="padding:18px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,122,24,.3);background:${PANEL};">
            <tr><td style="padding:16px 18px;">
              <div style="font-size:11px;letter-spacing:2px;color:${DIM};">PERFIL ANALIZADO</div>
              <div style="font-size:15px;color:#35FFA0;letter-spacing:1px;margin-top:4px;">
                ${esc(d.rol)} · ${esc(d.seniority)} · ${esc(d.pais)}${d.modalidad ? " · " + esc(d.modalidad) : ""}
              </div>
              <div style="height:1px;background:rgba(255,122,24,.25);margin:14px 0;"></div>
              <div style="font-size:11px;letter-spacing:2px;color:${DIM};">TU SALARIO REPORTADO</div>
              <div style="font-size:26px;color:${AMBER_HI};margin-top:2px;">$${fmt(d.salarioLocal)} ${esc(d.moneda)} <span style="font-size:13px;color:${AMBER};">/ mes</span></div>
              <div style="font-size:11px;letter-spacing:2px;color:${DIM};margin-top:14px;">MEDIANA DE REFERENCIA DE TU PERFIL</div>
              <div style="font-size:18px;color:${AMBER};margin-top:2px;">≈ US$ ${fmt(d.medianUSD)} / mes</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:18px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${p.color};background:${PANEL};">
            <tr><td style="${hazard.replace('10px','8px').replace('20px','16px')}">&nbsp;</td></tr>
            <tr><td style="padding:16px 18px;text-align:center;">
              <div style="font-size:11px;letter-spacing:3px;color:${DIM};">TU PATRÓN</div>
              <div style="font-size:24px;letter-spacing:2px;color:${p.color};margin:6px 0;">⚠ ${p.titulo}</div>
              <div style="font-size:13px;letter-spacing:1px;color:${AMBER};">${p.estado}</div>
              <div style="font-size:13px;color:${AMBER};line-height:1.6;margin-top:8px;">${p.msg}</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:18px 28px 0;color:${AMBER};font-size:13px;line-height:1.7;">
          <b style="color:${AMBER_HI};">¿Y ahora qué?</b><br/>
          Usa este dato como evidencia. La transparencia salarial es la mejor herramienta para negociar.
          Consulta otros roles y países en la terminal cuando quieras.
        </td></tr>

        <tr><td style="padding:20px 28px;">
          <a href="https://sueldazo-kappa.vercel.app" style="display:inline-block;background:${AMBER};color:#050503;text-decoration:none;font-family:${mono};font-weight:bold;letter-spacing:2px;padding:12px 22px;">▶ ABRIR LA TERMINAL MAGI</a>
        </td></tr>

        <tr><td style="${hazard}">&nbsp;</td></tr>
        <tr><td style="padding:16px 28px 24px;color:${DIM};font-size:11px;line-height:1.6;">
          Referencia agregada de fuentes públicas 2025/2026 (Talently, Vacantes Digitales, Get on Board, CodersLink)
          y vacantes en vivo de Adzuna. No es asesoría salarial. Estética inspirada en Neon Genesis Evangelion (fan-made).<br/>
          Recibes este correo porque solicitaste tu reporte en SUELDAZO // MAGI.
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "method_not_allowed" });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({ ok: false, reason: "not_configured" });
  }

  // body puede llegar como objeto (Vercel lo parsea) o string
  let d = req.body;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch { d = {}; }
  } else if (!d) { d = {}; }

  const email = String(d.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(200).json({ ok: false, reason: "invalid_email" });
  }

  const from = process.env.RESEND_FROM || "SUELDAZO MAGI <onboarding@resend.dev>";
  const p = patronDe(Number(d.pct) || 0);
  const subject = `🔶 Tu Reporte MAGI — ${p.titulo} (${esc(d.rol)} · ${esc(d.pais)})`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [email], subject, html: plantillaMAGI(d) }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(200).json({ ok: false, reason: "resend_error", status: r.status, detail: out });
    }
    return res.status(200).json({ ok: true, id: out.id });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "fetch_failed", mensaje: String(e) });
  }
};
