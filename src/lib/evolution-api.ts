// Evolution API client
// Docs: https://doc.evolution-api.com

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
  console.warn('Evolution API environment variables not set');
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_API_KEY || '',
};

export function getInstanceName(professionalId: string): string {
  return `voltai-${professionalId.substring(0, 8)}`;
}

export async function createInstance(professionalId: string): Promise<{ instanceName: string }> {
  const instanceName = getInstanceName(professionalId);
  const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });
  if (!res.ok) throw new Error(`Failed to create instance: ${res.statusText}`);
  return res.json();
}

export async function getQRCode(professionalId: string): Promise<{ base64: string } | null> {
  const instanceName = getInstanceName(professionalId);
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.base64 ? { base64: data.base64 } : null;
}

export async function getConnectionStatus(professionalId: string): Promise<'open' | 'connecting' | 'close'> {
  const instanceName = getInstanceName(professionalId);
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers,
    });
    if (!res.ok) return 'close';
    const data = await res.json();
    return data?.instance?.state || 'close';
  } catch {
    return 'close';
  }
}

export async function sendTextMessage(
  professionalId: string,
  phone: string,
  message: string
): Promise<boolean> {
  const instanceName = getInstanceName(professionalId);
  // Format phone: remove non-digits, ensure country code
  const formattedPhone = phone.replace(/\D/g, '');
  const phoneWithCode = formattedPhone.startsWith('55')
    ? formattedPhone
    : `55${formattedPhone}`;

  const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      number: phoneWithCode,
      text: message,
    }),
  });
  return res.ok;
}

export async function disconnectInstance(professionalId: string): Promise<void> {
  const instanceName = getInstanceName(professionalId);
  await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
    method: 'DELETE',
    headers,
  });
}

export function buildMessage(
  template: string,
  clientName: string,
  serviceName: string,
  daysOverdue: number
): string {
  return template
    .replace(/{nome}/g, clientName)
    .replace(/{serviço}/g, serviceName)
    .replace(/{dias}/g, String(Math.abs(daysOverdue)));
}
