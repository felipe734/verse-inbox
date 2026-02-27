# Verse Inbox

Lead Inbox + CRM mínima: WhatsApp Cloud API, conversaciones, asignación, tags y notas internas.

## Stack

- Next.js 14+ (App Router, TypeScript)
- Supabase (cliente JS, como versehost: URL + Service Role Key)
- WhatsApp Cloud API (Meta)
- NextAuth (Credentials)

## Setup local

1. **Clonar e instalar**
   ```bash
   cd verse-inbox && npm install
   ```

2. **Variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Rellenar en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API).
   - `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_VERIFY_TOKEN` (y opcional `WA_APP_SECRET` para firma del webhook).
   - `NEXTAUTH_SECRET`: `openssl rand -base64 32`
   - `NEXTAUTH_URL`: `http://localhost:3000`
   - `NEXTAUTH_DEMO_PASSWORD`: contraseña para el usuario demo (ej. `team@example.com`).

3. **Migraciones**
   Aplicar en orden los SQL en `supabase/migrations/`:
   - `001_inbox_crm.sql`
   - `002_teams_users_tags_notes.sql`
   - `003_users_password.sql` (opcional)
   Con Supabase: `supabase db push` o ejecutar los archivos en el SQL Editor.

4. **Arrancar**
   ```bash
   npm run dev
   ```
   - Login: http://localhost:3000/login (email: `team@example.com`, password: la que definiste en `NEXTAUTH_DEMO_PASSWORD`).
   - Inbox: http://localhost:3000/inbox

## Deploy en Vercel

1. Conectar el repo de GitHub al proyecto en Vercel.
2. Añadir en **Settings → Environment Variables** todas las variables de `.env.example` (y las opcionales que uses).
3. Deploy. Anotar la URL (ej. `https://verse-inbox.vercel.app`).

## Configurar webhook en Meta (WhatsApp)

1. [developers.facebook.com](https://developers.facebook.com) → tu app → WhatsApp → Configuración.
2. Webhook → Editar:
   - **URL**: `https://<tu-dominio-vercel>/api/webhooks/whatsapp`
   - **Verify token**: el mismo valor que `WA_VERIFY_TOKEN` en env.
3. Suscribir el campo **messages**.
4. Guardar. Meta hará un GET de verificación; el endpoint debe responder con el `hub.challenge` recibido.

## Probar inbound y outbound

- **Inbound**: Envía un mensaje de WhatsApp al número asociado a tu `WA_PHONE_NUMBER_ID`. Debe aparecer la conversación en Inbox.
- **Outbound**: En Inbox, abre una conversación y escribe en la caja "WhatsApp" y envía. El mensaje se envía por la API y se persiste; los statuses (sent/delivered/read) se actualizan vía webhook.

### Script de prueba de envío

```bash
npx tsx scripts/wa/test-send.ts 573001234567
```
(Reemplaza por el número destino, solo dígitos, sin `+`.)

### Simular webhook (inbound / statuses)

Usar el JSON de ejemplo en `scripts/wa/fixtures/wa-webhook-sample.json` y hacer un POST al webhook local (ngrok o túnel) con ese body para probar el flujo sin Meta.

## ENV vars (resumen)

| Variable | Requerido | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase (API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role key (secret) de Supabase |
| `WA_PHONE_NUMBER_ID` | Sí | ID del número de WhatsApp (Meta) |
| `WA_ACCESS_TOKEN` | Sí | Token de acceso (temporal o permanente) |
| `WA_VERIFY_TOKEN` | Sí | Token que Meta usa en GET de verificación |
| `WA_APP_SECRET` | No | App Secret para validar `x-hub-signature-256` |
| `NEXTAUTH_SECRET` | Sí | Secreto para JWT de NextAuth |
| `NEXTAUTH_URL` | Sí | URL de la app (ej. `https://...vercel.app`) |
| `NEXTAUTH_DEMO_PASSWORD` | Sí (demo) | Contraseña compartida para Credentials |

## Estructura del repo

- `src/app/api/webhooks/whatsapp/` — GET (verify) y POST (eventos WA).
- `src/app/api/send/wa/` — Envío de mensajes outbound.
- `src/app/api/conversations/[id]/assign|tags|notes` — Asignar, tags, notas internas.
- `src/app/(dashboard)/inbox/` — UI: lista de conversaciones y detalle con timeline, asignación, tags y respuesta.
- `src/lib/supabase/admin.ts` — Cliente Supabase (admin).
- `src/lib/inbox/` — Tipos, cliente WA, queries.
- `supabase/migrations/` — SQL para tablas (raw_events, leads, conversations, messages, users, teams, tags, etc.).
