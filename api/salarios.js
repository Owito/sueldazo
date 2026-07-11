// ============================================================
//  Sueldazo · API en vivo (Vercel Serverless Function)
//  Proxy a Adzuna: media salarial REAL de vacantes publicadas.
//  Cobertura LatAm de Adzuna: México (mx) y Brasil (br).
//
//  Requiere variables de entorno en Vercel:
//    ADZUNA_APP_ID   · ADZUNA_APP_KEY   (gratis en developer.adzuna.com)
//
//  GET /api/salarios?country=mexico&rol=backend
//  → { ok, pais, moneda, mensualMediaLocal, mensualMediaUSD, vacantes, histograma[], fuente }
// ============================================================

const ADZUNA_COUNTRY = { mexico: "mx", brasil: "br" };

// Rol (interno) → término de búsqueda ("what") en Adzuna.
// Palabras clave cortas: los títulos multi-palabra en inglés casi no existen
// en las vacantes de MX/BR y devuelven muestras diminutas.
const ROLE_WHAT = {
  frontend: "frontend",
  backend: "backend",
  fullstack: "full stack",
  devops: "devops",
  data: "data engineer",
  ai: "machine learning",
  mobile: "mobile",
  qa: "qa",
  pm: "product manager",
  design: "designer",
  otro: "developer",
};

const CURRENCY = { mx: "MXN", br: "BRL" };
const FX = { MXN: 18, BRL: 5.4 };

// Umbrales de fiabilidad
const MIN_VACANTES = 40;
const MIN_USD_MES = 300;
const MAX_USD_MES = 25000;

const adzunaUrl = (path, cc, params) =>
  `https://api.adzuna.com/v1/api/jobs/${cc}/${path}?` +
  new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    "content-type": "application/json",
    ...params,
  });

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");

  const { country = "mexico", rol = "backend" } = req.query || {};
  const cc = ADZUNA_COUNTRY[country];

  if (!cc) {
    return res.status(200).json({
      ok: false,
      reason: "unsupported",
      mensaje: "Adzuna solo cubre México y Brasil en LatAm.",
    });
  }
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    return res.status(200).json({
      ok: false,
      reason: "not_configured",
      mensaje: "Falta configurar ADZUNA_APP_ID / ADZUNA_APP_KEY.",
    });
  }

  const what = ROLE_WHAT[rol] || ROLE_WHAT.otro;
  const moneda = CURRENCY[cc];
  const fx = FX[moneda] || 1;

  try {
    // 1) Búsqueda → count + mean (salario anual local): la media más fiable
    const sr = await fetch(
      adzunaUrl("search/1", cc, { what, results_per_page: "1" }),
      { headers: { Accept: "application/json" } }
    );
    if (!sr.ok) {
      return res.status(200).json({ ok: false, reason: "adzuna_error", status: sr.status });
    }
    const s = await sr.json();
    const count = Number(s.count) || 0;
    const meanAnual = Number(s.mean) || 0;
    const mensualLocal = Math.round(meanAnual / 12);
    const mensualUSD = Math.round(mensualLocal / fx);

    // Guardas de calidad: muestra suficiente y valor plausible
    if (count < MIN_VACANTES || mensualUSD < MIN_USD_MES || mensualUSD > MAX_USD_MES) {
      return res.status(200).json({
        ok: false,
        reason: "low_sample",
        vacantes: count,
        mensaje: "Muestra insuficiente o no fiable en Adzuna para este perfil.",
      });
    }

    // 2) Histograma (distribución real) para graficar. Best-effort.
    let histograma = [];
    try {
      const hr = await fetch(adzunaUrl("histogram", cc, { what }), {
        headers: { Accept: "application/json" },
      });
      if (hr.ok) {
        const h = await hr.json();
        const hist = (h && h.histogram) || {};
        const bandas = Object.keys(hist)
          .map((k) => ({ anual: Number(k), n: Number(hist[k]) }))
          .filter((b) => Number.isFinite(b.anual) && b.n > 0)
          .sort((a, b) => a.anual - b.anual);
        const maxN = Math.max(1, ...bandas.map((b) => b.n));
        histograma = bandas.map((b) => ({
          mensual: Math.round(b.anual / 12),
          n: b.n,
          pct: Math.round((b.n / maxN) * 100),
        }));
      }
    } catch (_) {}

    return res.status(200).json({
      ok: true,
      pais: country,
      rol,
      what,
      moneda,
      mensualMediaLocal: mensualLocal,
      mensualMediaUSD: mensualUSD,
      vacantes: count,
      histograma,
      fuente: "Adzuna · media de vacantes con salario publicado (todos los niveles)",
    });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "fetch_failed", mensaje: String(e) });
  }
};
