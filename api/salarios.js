// ============================================================
//  Sueldazo · API en vivo (Vercel Serverless Function)
//  Proxy a Adzuna: histograma de salarios REALES de vacantes publicadas.
//  Cobertura LatAm de Adzuna: México (mx) y Brasil (br).
//
//  Requiere variables de entorno en Vercel:
//    ADZUNA_APP_ID   · ADZUNA_APP_KEY   (gratis en developer.adzuna.com)
//
//  GET /api/salarios?country=mexico&rol=backend
//  → { ok, pais, moneda, mensualMedianaLocal, mensualMedianaUSD, vacantes, histograma[], fuente }
// ============================================================

// País (interno) → código Adzuna
const ADZUNA_COUNTRY = { mexico: "mx", brasil: "br" };

// Rol (interno) → término de búsqueda ("what") en Adzuna
const ROLE_WHAT = {
  frontend: "frontend developer",
  backend: "backend developer",
  fullstack: "full stack developer",
  devops: "devops engineer",
  data: "data engineer",
  ai: "machine learning engineer",
  mobile: "mobile developer",
  qa: "qa engineer",
  pm: "product manager",
  design: "ux designer",
  otro: "software developer",
};

// Moneda local por código de país Adzuna + FX aprox (1 USD = X)
const CURRENCY = { mx: "MXN", br: "BRL" };
const FX = { MXN: 18, BRL: 5.4 };

// Mediana ponderada a partir del histograma de Adzuna.
// keys = borde inferior de la banda (salario anual local); values = nº de vacantes.
function medianaDesdeHistograma(hist) {
  const bandas = Object.keys(hist)
    .map((k) => ({ salario: Number(k), n: Number(hist[k]) }))
    .filter((b) => Number.isFinite(b.salario) && b.n > 0)
    .sort((a, b) => a.salario - b.salario);
  if (!bandas.length) return null;

  const ancho =
    bandas.length > 1 ? bandas[1].salario - bandas[0].salario : bandas[0].salario;
  // usar el punto medio de cada banda como valor representativo
  bandas.forEach((b) => (b.rep = b.salario + ancho / 2));

  const total = bandas.reduce((s, b) => s + b.n, 0);
  let acum = 0;
  for (const b of bandas) {
    acum += b.n;
    if (acum >= total / 2) return { mediana: b.rep, total, bandas };
  }
  return { mediana: bandas[bandas.length - 1].rep, total, bandas };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const { country = "mexico", rol = "backend" } = req.query || {};
  const cc = ADZUNA_COUNTRY[country];

  if (!cc) {
    return res.status(200).json({
      ok: false,
      reason: "unsupported",
      mensaje: "Adzuna solo cubre México y Brasil en LatAm.",
    });
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return res.status(200).json({
      ok: false,
      reason: "not_configured",
      mensaje: "Falta configurar ADZUNA_APP_ID / ADZUNA_APP_KEY.",
    });
  }

  const what = ROLE_WHAT[rol] || ROLE_WHAT.otro;
  const url =
    `https://api.adzuna.com/v1/api/jobs/${cc}/histogram` +
    `?app_id=${encodeURIComponent(appId)}` +
    `&app_key=${encodeURIComponent(appKey)}` +
    `&what=${encodeURIComponent(what)}` +
    `&content-type=application/json`;

  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      return res
        .status(200)
        .json({ ok: false, reason: "adzuna_error", status: r.status });
    }
    const json = await r.json();
    const hist = json && json.histogram;
    if (!hist || !Object.keys(hist).length) {
      return res.status(200).json({ ok: false, reason: "no_data" });
    }

    const m = medianaDesdeHistograma(hist);
    if (!m) return res.status(200).json({ ok: false, reason: "no_data" });

    const moneda = CURRENCY[cc];
    const mensualLocal = Math.round(m.mediana / 12);
    const mensualUSD = Math.round(mensualLocal / (FX[moneda] || 1));

    // histograma normalizado (mensual local) para graficar
    const maxN = Math.max(...m.bandas.map((b) => b.n));
    const histograma = m.bandas.map((b) => ({
      mensual: Math.round(b.rep / 12),
      n: b.n,
      pct: Math.round((b.n / maxN) * 100),
    }));

    return res.status(200).json({
      ok: true,
      pais: country,
      rol,
      what,
      moneda,
      mensualMedianaLocal: mensualLocal,
      mensualMedianaUSD: mensualUSD,
      vacantes: m.total,
      histograma,
      fuente: "Adzuna · empleos publicados (histograma de salarios)",
    });
  } catch (e) {
    return res
      .status(200)
      .json({ ok: false, reason: "fetch_failed", mensaje: String(e) });
  }
}
