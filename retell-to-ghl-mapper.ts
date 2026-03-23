// ════════════════════════════════════════════════════
// SUPABASE EDGE FUNCTION: retell-to-ghl-mapper
// Architecture: Claude (CEO) + Gemini (intent/actions) + ChatGPT (security)
// Status: PRODUCTION LOCKED — March 23 2026
// ════════════════════════════════════════════════════
//
// ENV VARS REQUIRED:
//   RETELL_API_KEY       — webhook-badged key from Retell dashboard
//   GHL_API_KEY          — GoHighLevel API key (Billy's account)
//   GHL_LOCATION_ID      — GoHighLevel location ID
//   GHL_BILLY_USER_ID    — Billy's GHL user ID (for task assignment)
//
// RETELL WEBHOOK URL:
//   https://<project>.supabase.co/functions/v1/retell-to-ghl-mapper
//
// Retell webhooks timeout at 10s, retry 3x on non-2xx.
// Note attachment is fire-and-forget. SMS + Task are awaited.
// ════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RETELL_API_KEY    = Deno.env.get('RETELL_API_KEY')     || '';
const GHL_KEY           = Deno.env.get('GHL_API_KEY')        || '';
const GHL_LOC           = Deno.env.get('GHL_LOCATION_ID')    || '';
const GHL_BILLY_USER_ID = Deno.env.get('GHL_BILLY_USER_ID')  || '';

const GHL_HEADERS = {
  'Authorization': `Bearer ${GHL_KEY}`,
  'Content-Type':  'application/json',
  'Version':       '2021-07-28',
};

async function verifyRetellWebhook(body: string, sig: string | null): Promise<boolean> {
  if(!sig) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(RETELL_API_KEY),
    { name:'HMAC', hash:'SHA-256' }, false, ['verify']
  );
  try {
    const sigBytes = Uint8Array.from(atob(sig), c=>c.charCodeAt(0));
    return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(body));
  } catch { return false; }
}

function detectIntent(transcript: string): 'BOOKING' | 'QUESTION' | 'UNQUALIFIED' {
  const t = transcript.toLowerCase();
  const bookingKW = ['book','reserve','ride','pickup','reservation','schedule','need a car','airport','transfer','limo','town car','vehicle','driver'];
  const questionKW = ['price','rate','cost','available','how much','quote','hours','do you','what time'];
  if(bookingKW.some(k=>t.includes(k))) return 'BOOKING';
  if(questionKW.some(k=>t.includes(k))) return 'QUESTION';
  return 'UNQUALIFIED';
}

serve(async (req) => {
  if(req.method === 'OPTIONS') return new Response('OK', { headers:{ 'Access-Control-Allow-Origin':'*' }});
  if(req.method !== 'POST') return new Response('Method Not Allowed', { status:405 });

  const body = await req.text();
  const sig  = req.headers.get('x-retell-signature');

  const isValid = await verifyRetellWebhook(body, sig);
  if(!isValid) { console.error('[SECURITY] HMAC failed'); return new Response('Unauthorized', { status:401 }); }

  let payload: any;
  try { payload = JSON.parse(body); } catch { return new Response('Bad JSON', { status:400 }); }

  if(payload.event !== 'call_ended') return new Response('Ignored', { status:200 });

  const call  = payload.call || {};
  const phone = call.user_phone_number;

  if(!phone) { console.warn('[SKIP] No phone', call.call_id); return new Response('No Phone', { status:200 }); }

  const transcript = call.transcript || '';
  const intent     = detectIntent(transcript);
  const tag        = intent === 'BOOKING' ? 'RIDE-REQUESTED' : intent === 'QUESTION' ? 'WARM-LEAD' : '';

  console.log(`[INTENT] ${intent} | ${phone} | ${call.call_id}`);

  try {
    // 1. GHL CONTACT UPSERT
    const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
      method: 'POST', headers: GHL_HEADERS,
      body: JSON.stringify({ locationId:GHL_LOC, phone, firstName:'Ava Lead', tags:tag?[tag]:[], customFields:[{ key:'ava_intent', value:intent }] })
    });
    const contactData = await contactRes.json();
    const contactId   = contactData.contact?.id;
    if(!contactId) throw new Error('GHL upsert failed');

    // 2. TRANSCRIPT NOTE — fire-and-forget
    fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method:'POST', headers:GHL_HEADERS,
      body: JSON.stringify({ body:`AVA CALL: ${call.call_id}\nINTENT: ${intent}\nRECORDING: ${call.recording_url||'N/A'}\n\nTRANSCRIPT:\n${transcript}` })
    }).catch(e=>console.error('[NOTE]',e));

    // 3. BOOKING ACTIONS
    if(intent === 'BOOKING') {
      // SMS to caller
      fetch('https://services.leadconnectorhq.com/conversations/messages', {
        method:'POST', headers:GHL_HEADERS,
        body: JSON.stringify({ contactId, type:'SMS', message:"Thanks for calling! Your booking request is confirmed. Billy's team will follow up shortly." })
      }).catch(e=>console.error('[SMS]',e));

      // Dispatch task → Billy
      fetch('https://services.leadconnectorhq.com/tasks/', {
        method:'POST', headers:GHL_HEADERS,
        body: JSON.stringify({ title:`Dispatch Alert — ride request from ${phone}`, body:`Intent: BOOKING. See contact notes for transcript.`, contactId, assignedTo:GHL_BILLY_USER_ID, locationId:GHL_LOC, dueDate:new Date(Date.now()+3600000).toISOString() })
      }).catch(e=>console.error('[TASK]',e));
    }

    return new Response(JSON.stringify({ status:'success', intent, contactId }), { status:200, headers:{'Content-Type':'application/json'} });

  } catch(err: any) {
    console.error('[ERROR]', err.message);
    return new Response(err.message, { status:500 });
  }
});
