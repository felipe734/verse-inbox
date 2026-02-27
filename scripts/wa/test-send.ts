/**
 * Send a test WhatsApp message via Graph API.
 * Usage: npx tsx scripts/wa/test-send.ts <to_number>
 * Example: npx tsx scripts/wa/test-send.ts 573001234567
 * to_number: digits only (no +). Set in env or pass as first arg.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config(); // fallback .env
import { sendWhatsAppText } from "../../src/lib/inbox/wa-client";

async function main() {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;
  const to = process.argv[2] ?? process.env.WA_TEST_TO;

  if (!phoneNumberId || !accessToken) {
    console.error("Set WA_PHONE_NUMBER_ID and WA_ACCESS_TOKEN in .env");
    process.exit(1);
  }
  if (!to) {
    console.error("Usage: npx tsx scripts/wa/test-send.ts <to_number> (digits only, e.g. 573001234567)");
    process.exit(1);
  }

  const text = "Test from verse-inbox script.";
  console.log("Sending to", to, "...");
  const result = await sendWhatsAppText(phoneNumberId, accessToken, to.replace(/\D/g, ""), text);
  if (result.error) {
    console.error("Error:", result.error);
    process.exit(1);
  }
  console.log("Sent. Message ID:", result.messages?.[0]?.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
