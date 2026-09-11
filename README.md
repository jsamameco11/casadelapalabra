# Casa de la Palabra

Dos aplicaciones Next.js que comparten el mismo proyecto de Supabase.

| Carpeta | Qué es | Dominio |
| --- | --- | --- |
| [`casa-de-la-palabra-web`](casa-de-la-palabra-web) | Sitio público: Biblia, estudios, media y juegos | `casadelapalabra.miacademiapreu.com` |
| [`casa-de-la-palabra-admin`](casa-de-la-palabra-admin) | Panel de control interno | `control-casadelapalabra.miacademiapreu.com` |

## Puesta en marcha

Cada carpeta es un proyecto independiente:

```bash
cd casa-de-la-palabra-web   # o casa-de-la-palabra-admin
npm install
cp .env.example .env.local  # completar con las credenciales reales
npm run dev
```

## Variables de entorno

Nunca se suben a este repositorio. `.env.example` en cada app documenta cuáles hacen falta; los valores reales viven en `.env.local` (local) y en `/opt/<app>/.env.production` (servidor).

## Biblia: traducciones y licencias

Cada traducción declara su licencia en `casa_bible_translations.license_type`, y de eso depende de dónde sale el texto:

- **`public_domain`** — el texto se guarda en la base de datos (`casa_bible_verses`). Aquí entran Reina-Valera 1909, King James Version, y los textos en idioma original: Westminster Leningrad Codex (hebreo/arameo) y Textus Receptus (griego).
- **`api_passthrough`** — el texto **nunca** se almacena: se pide en vivo a [api.bible](https://scripture.api.bible) en cada visita y se muestra con su aviso de copyright obligatorio. Aquí entran NTV, GNT y Amplified Bible.

Antes de agregar una traducción con derechos de autor, hay que tener la licencia a nombre de la cuenta de api.bible; no se importa texto con copyright a la base de datos.

## Notas de despliegue

- El sitio va detrás de Cloudflare, con Apache haciendo de proxy inverso hacia Next.js.
- La app fuerza HTTPS desde `src/proxy.ts` leyendo `x-forwarded-proto`, **no** desde Apache: un redirect en el puerto 80 provocaría un bucle infinito si Cloudflare llega al origen por HTTP. Esto es obligatorio para el login con Google, que rechaza cualquier origen `http://` con `origin_mismatch`.
