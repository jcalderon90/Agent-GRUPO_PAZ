import axios, { AxiosError } from 'axios';
import { env } from '../config/env.js';

const BASE = 'https://api.manychat.com';

function headers() {
  return { Authorization: `Bearer ${env.MANYCHAT_API_TOKEN}`, 'Content-Type': 'application/json' };
}

function isWindowExpiredError(err: AxiosError): boolean {
  const data = err.response?.data as Record<string, unknown> | undefined;
  return err.response?.status === 400 && (data?.code === 3011 || String(data?.message ?? '').includes('last interaction'));
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// IDs de 17+ dígitos pierden precisión con JSON.parse — enviamos como raw string
async function sendContent(
  subscriberId: string,
  messages: unknown[],
  channel: 'whatsapp' | 'instagram' | 'messenger' = 'whatsapp',
  attempt = 1,
): Promise<void> {
  const contentObj = channel === 'messenger'
    ? { messages }
    : { type: channel, messages };

  const data = { version: 'v2', content: contentObj };
  const bodyStr = `{"subscriber_id":${subscriberId},"data":${JSON.stringify(data)}}`;

  try {
    const res = await axios.post(`${BASE}/fb/sending/sendContent`, bodyStr, { headers: headers() });
    console.log(`[MANYCHAT] sent to ${subscriberId} (${channel}) ✓`, res.data?.status);
  } catch (err) {
    const e = err as AxiosError;
    // Race condition: ManyChat a veces tarda en registrar la interacción — reintentar una vez
    if (isWindowExpiredError(e) && attempt === 1) {
      console.warn(`[MANYCHAT] window error — reintentando en 7s`);
      await sleep(7000);
      return sendContent(subscriberId, messages, channel, 2);
    }
    const details = e.response?.data;
    console.error(`[MANYCHAT] sendContent failed (${channel}):`, JSON.stringify(details ?? e.message));
    throw err;
  }
}

function splitText(text: string, max = 1900): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.5) cut = max;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export const ManyChat = {
  async sendContent(subscriberId: string, text: string, channel: 'whatsapp' | 'instagram' | 'messenger' = 'whatsapp'): Promise<void> {
    const messages = splitText(text).map(t => ({ type: 'text', text: t }));
    await sendContent(subscriberId, messages, channel);
  },
};
