/**
 * Voltai - Cron de lembretes automáticos (3 etapas)
 * Roda diariamente via crontab às 9h
 *
 * Etapa 1 (return_date atingida):     envia mensagem inicial
 * Etapa 2 (+24h sem retorno):         envia follow-up humanizado
 * Etapa 3 (+24h após follow-up):      marca como alerta no app (sem mensagem)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gyzjmejklhcfqlcbfspu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'voltai-evolution-key-2026';

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY não definida. Configure em /var/www/voltai/.env.cron');
  process.exit(1);
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${await res.text()}`);
}

function buildMessage(template, clientName, serviceName, days) {
  return template
    .replace(/{nome}/g, clientName)
    .replace(/{serviço}/g, serviceName)
    .replace(/{dias}/g, String(Math.abs(days)));
}

function getInstanceName(professionalId) {
  return `voltai-${professionalId.substring(0, 8)}`;
}

async function sendWhatsApp(professionalId, phone, message) {
  const instance = getInstanceName(professionalId);
  const formatted = phone.replace(/\D/g, '');
  const number = formatted.startsWith('55') ? formatted : `55${formatted}`;
  const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
    body: JSON.stringify({ number, textMessage: { text: message } }),
  });
  return res.ok;
}

function hoursSince(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

async function main() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n[${new Date().toISOString()}] Cron iniciado — ${today}`);

  // Busca appointments com return_date vencida
  const appointments = await supabaseGet(
    `appointments?return_date=lte.${today}&select=id,client_id,service_id,professional_id,return_date`
  );

  if (!appointments.length) {
    console.log('Nenhum appointment vencido hoje.');
    return;
  }

  // Busca todos os reminders relacionados
  const apptIds = appointments.map(a => `"${a.id}"`).join(',');
  const reminders = await supabaseGet(
    `reminders?appointment_id=in.(${apptIds})&select=id,appointment_id,status,sent_at,returned_at&order=sent_at.asc`
  );

  // Agrupa reminders por appointment
  const remindersByAppt = {};
  for (const r of reminders) {
    if (!remindersByAppt[r.appointment_id]) remindersByAppt[r.appointment_id] = [];
    remindersByAppt[r.appointment_id].push(r);
  }

  for (const appt of appointments) {
    try {
      const apptReminders = remindersByAppt[appt.id] || [];

      // Se cliente já retornou, pula
      const returned = apptReminders.some(r => r.returned_at);
      if (returned) continue;

      // Determina etapa atual
      const sentInitial  = apptReminders.find(r => r.status === 'sent');
      const sentFollowup = apptReminders.find(r => r.status === 'followup');
      const hasAlert     = apptReminders.find(r => r.status === 'alert');

      // Etapa 3: já tem follow-up há +24h e ainda não voltou → marca alerta
      if (sentFollowup && !hasAlert && hoursSince(sentFollowup.sent_at) >= 24) {
        await supabasePost('reminders', {
          appointment_id: appt.id,
          professional_id: appt.professional_id,
          sent_at: new Date().toISOString(),
          status: 'alert',
          returned_at: null,
        });
        console.log(`[ALERTA] appointment ${appt.id} — cliente não respondeu`);
        continue;
      }

      // Etapa 2: já tem mensagem inicial há +24h → envia follow-up
      if (sentInitial && !sentFollowup && hoursSince(sentInitial.sent_at) >= 24) {
        const [clients, professionals] = await Promise.all([
          supabaseGet(`clients?id=eq.${appt.client_id}&select=name,phone`),
          supabaseGet(`professionals?id=eq.${appt.professional_id}&select=id,whatsapp_connected`),
        ]);
        const client = clients[0];
        const professional = professionals[0];
        if (!professional?.whatsapp_connected) continue;

        const firstName = client.name.split(' ')[0];
        const message = `Oie, ${firstName}! 😊 Você viu minha mensagem? Estou com horário disponível essa semana — me chama aqui e já reservamos o seu! 🗓️`;

        const sent = await sendWhatsApp(appt.professional_id, client.phone, message);
        await supabasePost('reminders', {
          appointment_id: appt.id,
          professional_id: appt.professional_id,
          sent_at: new Date().toISOString(),
          status: sent ? 'followup' : 'failed',
          returned_at: null,
        });
        console.log(`[FOLLOW-UP ${sent ? 'OK' : 'FALHOU'}] ${client.name}`);
        continue;
      }

      // Etapa 1: nenhum lembrete ainda → envia mensagem inicial
      if (!sentInitial) {
        const [clients, professionals, services] = await Promise.all([
          supabaseGet(`clients?id=eq.${appt.client_id}&select=name,phone`),
          supabaseGet(`professionals?id=eq.${appt.professional_id}&select=id,whatsapp_connected`),
          supabaseGet(`services?id=eq.${appt.service_id}&select=name,message_template,interval_days`),
        ]);
        const client = clients[0];
        const professional = professionals[0];
        const service = services[0];
        if (!professional?.whatsapp_connected) continue;

        const returnDate = new Date(appt.return_date);
        const daysOverdue = Math.floor((Date.now() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
        const template = service.message_template ||
          'Oi {nome}! 😊 Já faz {dias} dias desde o seu {serviço}. Que tal agendar novamente?';
        const message = buildMessage(template, client.name.split(' ')[0], service.name, daysOverdue);

        const sent = await sendWhatsApp(appt.professional_id, client.phone, message);
        await supabasePost('reminders', {
          appointment_id: appt.id,
          professional_id: appt.professional_id,
          sent_at: new Date().toISOString(),
          status: sent ? 'sent' : 'failed',
          returned_at: null,
        });
        console.log(`[INICIAL ${sent ? 'OK' : 'FALHOU'}] ${client.name} — ${service.name}`);
      }

    } catch (err) {
      console.error(`Erro no appointment ${appt.id}:`, err.message);
    }
  }

  console.log(`[${new Date().toISOString()}] Cron finalizado.`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
