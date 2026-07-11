# 🔶 SUELDAZO // MAGI — Sistema de análisis salarial tech de LatAm

Terminal (estética NERV/MAGI de *Neon Genesis Evangelion*) para la **Vibe Coders League – Proyecto 2**.
**Value-first:** muestra al instante la **mediana real** de sueldos tech por rol/seniority/país (datos
agregados de fuentes públicas 2025/2026), y luego captura tu dato anónimo en **Supabase** para darte tu "patrón".

- **Stack:** HTML + CSS (terminal con clip-path, scanlines CRT, respeta `prefers-reduced-motion`) + JS vanilla + Supabase JS.
- **Sin build.** Sitio estático: se despliega tal cual.

**Archivos:**
- `index.html` — la terminal MAGI (UI + lógica).
- `data.js` — dataset de referencia salarial citado (medianas por rol×seniority×país, multiplicadores, FX, fuentes).
- `api/salarios.js` — serverless function (Vercel): señal en vivo con **Adzuna** (media real de vacantes MX/BR).
- `api/reporte.js` — serverless function (Vercel): envía el "Reporte MAGI" por correo vía **Resend** (plantilla HTML).
- `config.js` — tus llaves de Supabase.
- `supabase-schema.sql` — tabla `salarios` + RLS + función de conteo.
- `textos-difusion.md` — publicación de Platzi + posts de redes.

## 🔌 Señal en vivo (Adzuna) — opcional
El panel "SEÑAL EN VIVO · ADZUNA" muestra la media real de vacantes con salario publicado
(cobertura LatAm de Adzuna: **México y Brasil**). Requiere variables de entorno en Vercel:

```bash
echo "TU_APP_ID"  | vercel env add ADZUNA_APP_ID  production
echo "TU_APP_KEY" | vercel env add ADZUNA_APP_KEY production
vercel --prod --yes
```
Llaves gratis en https://developer.adzuna.com (dashboard → API Access Details).
Sin llaves, el panel muestra "en espera de configuración" y el resto del sitio funciona igual.

## ✉️ Reporte por correo (Resend) — opcional
Al transmitir su dato, el usuario recibe el "Reporte MAGI" por correo (plantilla NERV en `api/reporte.js`).
Variables de entorno en Vercel:

```bash
echo "re_XXXX" | vercel env add RESEND_API_KEY production
# opcional: remitente de un dominio verificado en Resend
echo "SUELDAZO MAGI <reporte@tudominio.com>" | vercel env add RESEND_FROM production
vercel --prod --yes
```
Llave gratis en https://resend.com. **Nota:** sin un dominio verificado, Resend solo entrega al
correo con el que te registraste (modo prueba); para enviar a cualquier destinatario, verifica un
dominio en Resend y define `RESEND_FROM`. Sin `RESEND_API_KEY`, el sitio registra el dato igual y
muestra "envío en configuración".

---

## 🚀 Puesta en marcha (≈10 min, pasos humanos)

### 1. Crear el proyecto en Supabase
1. Entra a https://supabase.com → **New project** (plan gratis).
2. Cuando esté listo, ve a **SQL Editor → New query**, pega el contenido de
   [`supabase-schema.sql`](./supabase-schema.sql) y pulsa **Run**.
   Esto crea la tabla `salarios`, activa RLS (solo INSERT para el público) y la función de conteo.

### 2. Conectar la landing
1. En Supabase ve a **Project Settings → API**.
2. Copia **Project URL** y la **anon public key**.
3. Pégalas en [`config.js`](./config.js):
   ```js
   window.SUELDAZO_CONFIG = {
     url: "https://xxxxx.supabase.co",
     anonKey: "eyJhbGciOi..."
   };
   ```
   > La `anon key` es pública por diseño. Con la política RLS "solo INSERT",
   > nadie puede **leer** los datos con ella: es seguro para este formulario.

### 3. Probar en local
Abre una terminal en esta carpeta y sirve los archivos (necesario para que
cargue `config.js` y el cliente de Supabase):
```bash
npx serve .
# o:  python -m http.server 5173
```
Abre la URL que imprima, llena el formulario y verifica en Supabase
(**Table Editor → salarios**) que la fila se guardó.

### 4. Desplegar (elige uno)

**Vercel (recomendado):**
```bash
npm i -g vercel
vercel        # sigue el asistente; framework = Other, output = raíz
vercel --prod
```

**o Netlify drop:** arrastra la carpeta a https://app.netlify.com/drop

**o GitHub Pages:** sube la carpeta a un repo y actívalo en Settings → Pages.

Copia el link público resultante: es el que pegas en Platzi y compartes.

---

## 🔒 Notas
- Honeypot anti-spam incluido (campo oculto `website`).
- Los datos salariales quedan privados (no hay policy de SELECT para `anon`).
- Los rangos de referencia del resultado son **estimaciones ilustrativas**; el
  reporte "real" se arma con los datos que aporte la comunidad.
