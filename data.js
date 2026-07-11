/* ============================================================
 *  Sueldazo · Dataset de referencia salarial tech LatAm
 *  Medianas mensuales estimadas (USD, base México ≈ referencia LatAm),
 *  AGREGADAS de fuentes públicas 2025/2026. No son datos en vivo:
 *  son referencia de mercado para orientar negociaciones.
 *
 *  Fuentes:
 *   - Talently · Reporte de salarios tech 2025 (rangos por rol/seniority)
 *   - Vacantes Digitales · Salarios Tech LatAm 2026 (multiplicadores por país, premium remoto/inglés)
 *   - Get on Board · Insights Pro (medianas por rol/seniority/geografía)
 *   - CodersLink · Reporte de Salarios TI México
 * ============================================================ */
window.SUELDAZO_DATA = {
  actualizado: "2025-2026",

  // Mediana USD/mes por rol × seniority — MERCADO LOCAL, base México (≈ referencia LatAm).
  // Valores conservadores de mercado local; el toggle "remoto int'l" aplica el premium (+30%).
  medianas: {
    frontend:  { junior:900,  semi:1800, senior:3000, lead:4200 },
    backend:   { junior:1000, semi:2100, senior:3400, lead:4700 },
    fullstack: { junior:1050, semi:2200, senior:3600, lead:5000 },
    devops:    { junior:1300, semi:2600, senior:4200, lead:5800 },
    data:      { junior:1300, semi:2600, senior:4200, lead:5800 },
    ai:        { junior:1600, semi:3000, senior:5000, lead:7000 },
    mobile:    { junior:1000, semi:2100, senior:3400, lead:4700 },
    qa:        { junior:800,  semi:1600, senior:2600, lead:3600 },
    pm:        { junior:1200, semi:2400, senior:4000, lead:5600 },
    design:    { junior:850,  semi:1700, senior:2800, lead:3900 },
    otro:      { junior:900,  semi:1800, senior:3000, lead:4200 }
  },

  // Multiplicador por país (base México = 1.00) — Vacantes Digitales 2026
  paisMult: {
    mexico:1.00, colombia:0.90, argentina:0.95, chile:1.05, brasil:0.92,
    peru:0.85, ecuador:0.85, uruguay:1.10, costa_rica:1.08, bolivia:0.80,
    paraguay:0.82, venezuela:0.75, guatemala:0.85, otro:0.90
  },

  // Premium por trabajar remoto para empresa internacional (USA/EU)
  remotoMult: 1.30,

  // Moneda local por país
  moneda: {
    mexico:"MXN", colombia:"COP", argentina:"ARS", chile:"CLP", brasil:"BRL",
    peru:"PEN", ecuador:"USD", uruguay:"UYU", costa_rica:"CRC", bolivia:"BOB",
    paraguay:"PYG", venezuela:"USD", guatemala:"GTQ", otro:"USD"
  },

  // Tipo de cambio aprox (1 USD = X moneda local)
  fx: {
    USD:1, MXN:18, COP:4000, ARS:1000, CLP:950, BRL:5.4,
    PEN:3.7, UYU:40, CRC:520, BOB:6.9, PYG:7300, GTQ:7.8
  },

  // Etiquetas legibles
  labels: {
    rol: {
      frontend:"Frontend", backend:"Backend", fullstack:"Full-stack",
      devops:"DevOps / Cloud", data:"Data / ML", ai:"AI / GenAI",
      mobile:"Mobile", qa:"QA / Testing", pm:"Product / PM",
      design:"Diseño / UX", otro:"Otro"
    },
    seniority: { junior:"Junior", semi:"Semi-Senior", senior:"Senior", lead:"Lead / Staff" },
    pais: {
      mexico:"México", colombia:"Colombia", argentina:"Argentina", chile:"Chile",
      brasil:"Brasil", peru:"Perú", ecuador:"Ecuador", uruguay:"Uruguay",
      costa_rica:"Costa Rica", bolivia:"Bolivia", paraguay:"Paraguay",
      venezuela:"Venezuela", guatemala:"Guatemala", otro:"Otro (LatAm)"
    }
  },

  fuentes: [
    { nodo:"MELCHIOR", nombre:"Talently · Reporte Salarios Tech 2025", url:"https://talently.tech/blog/salarios-programadores-por-rol-seniority-latam/" },
    { nodo:"BALTHASAR", nombre:"Vacantes Digitales · Salarios LatAm 2026", url:"https://vacantesdigitales.com/salarios/" },
    { nodo:"CASPER", nombre:"Get on Board · Insights Pro + comunidad Sueldazo", url:"https://www.getonbrd.com.co/insightspro" }
  ]
};

/* Cálculo de la referencia de mercado para una selección */
window.SUELDAZO_calc = function(rol, seniority, pais, remoto){
  const D = window.SUELDAZO_DATA;
  const baseUSD = D.medianas[rol][seniority];
  const mult = (D.paisMult[pais] || 0.9) * (remoto ? D.remotoMult : 1);
  const medianUSD = Math.round(baseUSD * mult);
  const p25USD = Math.round(medianUSD * 0.80);
  const p75USD = Math.round(medianUSD * 1.28);
  const cur = remoto ? "USD" : (D.moneda[pais] || "USD");
  const fx = D.fx[cur] || 1;
  return {
    medianUSD, p25USD, p75USD,
    medianLocal: Math.round(medianUSD * fx),
    p25Local: Math.round(p25USD * fx),
    p75Local: Math.round(p75USD * fx),
    moneda: cur
  };
};
