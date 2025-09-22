import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.SPARKPOST_BASE_URL;
const API_KEY  = process.env.SPARKPOST_API_KEY;
const FROM     = process.env.SPARKPOST_FROM_EMAIL;

/**
 * Gửi email qua SparkPost REST Transmissions API (không chờ đợi ở controller)
 * @param {{to: string, subject: string, html: string, text?: string, returnPath?: string}} opts
 */
export async function sendEmail(opts) {
  if (!API_KEY) {
    console.warn('[mail] SPARKPOST_API_KEY missing, skip sending');
    return;
  }
  const payload = {
    options: {
      transactional: true
    },
    content: {
      from: FROM,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || ''
    },
    recipients: [{ address: { email: opts.to } }]
  };

  const res = await fetch(`${BASE_URL}/transmissions`, {
    method: 'POST',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[mail] SparkPost error ${res.status}: ${body}`);
  }
}
