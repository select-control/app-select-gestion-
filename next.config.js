/** @type {import('next').NextConfig} */

const SUPABASE = "https://voytaxbvwdwxhedhjkbo.supabase.co";

// Política de Seguridad de Contenido (CSP): controla de dónde puede cargar
// recursos la web. Solo permite recursos propios y la conexión a Supabase.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Cabeceras de seguridad estándar que se aplican a TODAS las respuestas.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Obliga a usar HTTPS durante 2 años (protege contra interceptación de tráfico).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Impide que la web se incruste en un iframe ajeno (anti-clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Impide que el navegador "adivine" tipos de archivo (anti-XSS).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limita la información de origen que se envía a otras webs.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva permisos de hardware que la app no usa (cámara, micro, ubicación).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Aísla la web de otras pestañas (protección extra del navegador).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  // No revelar que el servidor usa Next.js (menos información para un atacante).
  poweredByHeader: false,
  experimental: {
    // Permite subir documentos/imágenes de contratos (por defecto Next limita a 1 MB).
    serverActions: { bodySizeLimit: "15mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
