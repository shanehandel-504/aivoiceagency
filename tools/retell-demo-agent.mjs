#!/usr/bin/env node
/* ============================================================================
   tools/retell-demo-agent.mjs  ·  RUN 1 · HEAR AVA LIVE
   ----------------------------------------------------------------------------
   Creates / updates the two demo agents from ONE source of truth:
   docs/demo-agent-prompt.md.

     · AVA HEAR-IT-LIVE v1           — brand voice (Ava). Wired to the pool.
     · AVA HEAR-IT-LIVE v1-CARTESIA  — identical, Cartesia voice. BAKE-OFF ONLY,
                                       never attached to a public path.

   The prompt shipped to Retell is the markdown file from "## ROLE" to EOF, so
   swapping in Shane's verbatim v2 script means editing the .md and re-running
   this with --update. Nothing else changes.

   USAGE (always through Doppler — the key never touches disk):
     doppler run --project ava-prod --config prd -- node tools/retell-demo-agent.mjs --create
     doppler run --project ava-prod --config prd -- node tools/retell-demo-agent.mjs --update
     doppler run --project ava-prod --config prd -- node tools/retell-demo-agent.mjs --show

   Build-time only. tools/ is never deployed (see .vercelignore).
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const API = 'https://api.retellai.com';
const KEY = process.env.RETELL_API_KEY;

if (!KEY) {
  console.error('RETELL_API_KEY missing. Run this through: doppler run --project ava-prod --config prd -- node tools/retell-demo-agent.mjs ...');
  process.exit(1);
}

/* ------------------------------------------------------------- constants -- */

// The Retell handle for the ElevenLabs brand voice "Ava - Eager, Helpful and
// Understanding". The RUN 1 brief named the raw ElevenLabs id
// gJx1vCzNCD1EQHT212Ls, which Retell does not accept as a voice_id -- this is
// the same voice as Retell exposes it, and the one AVA SALES already ships.
const VOICE_BRAND = 'custom_voice_705a2cb49b0413f7fc1c456d02';
const VOICE_CARTESIA = 'cartesia-Evie'; // female / American — closest bake-off match

const POSTCALL_WEBHOOK = 'https://circulant.app.n8n.cloud/webhook/live-postcall';

const REGISTRY = join(ROOT, 'automation', 'retell-agent-config.json');

/* ---------------------------------------------------------------- prompt -- */

function loadPrompt() {
  const md = readFileSync(join(ROOT, 'docs', 'demo-agent-prompt.md'), 'utf8');
  // Match the real heading at line-start, not the "## ROLE" mentioned in the
  // provenance note's prose above it.
  const m = md.match(/^## ROLE\s*$/m);
  if (!m) throw new Error('docs/demo-agent-prompt.md has no "## ROLE" heading — cannot build the prompt.');
  return md.slice(m.index).trim();
}

/* Pull the voicemail message out of the same doc so the two can never drift. */
function loadVoicemail(md) {
  const sec = md.slice(md.indexOf('## VOICEMAIL'));
  const lines = sec.split('\n');
  const out = [];
  let started = false;
  for (const ln of lines) {
    if (ln.startsWith('> ')) { started = true; out.push(ln.slice(2).trim()); continue; }
    if (started && !ln.startsWith('>')) break;
  }
  // The doc wraps the message in typographic quotes for readability — Retell
  // must receive the bare spoken text.
  const text = out.join(' ').replace(/\s+/g, ' ').trim().replace(/^["“”]+|["“”]+$/g, '').trim();
  if (!text) throw new Error('Could not extract the voicemail block from docs/demo-agent-prompt.md');
  return text;
}

/* ------------------------------------------------------------------ http -- */

async function call(method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const txt = await r.text();
  let json;
  try { json = txt ? JSON.parse(txt) : {}; } catch { json = { raw: txt }; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${txt.slice(0, 500)}`);
  return json;
}

/* ----------------------------------------------------------------- specs -- */

function llmSpec(prompt) {
  return {
    model: 'gpt-4.1',
    model_temperature: 0.1,
    model_high_priority: true,
    tool_call_strict_mode: true,
    general_prompt: prompt,
    // begin_message omitted => AVA speaks first (outbound: the caller is expecting us).
    general_tools: [
      {
        type: 'end_call',
        name: 'end_call',
        description: 'End the call. Use after the STAGE 5 close, after an opt-out, after a human hand-off, or on the spam/IVR fast-exit.'
      }
    ],
    // Fallbacks for every dynamic variable, so a failed scrape can never put a
    // literal {{token}} or an empty hole into AVA's mouth.
    default_dynamic_variables: {
      first_name: 'there',
      company_name: 'your business',
      website_url: '',
      city: '',
      service_1: 'the work you do',
      service_2: '',
      scraped_fact: ''
    }
  };
}

function agentSpec(name, voiceId, llmId, voicemailText) {
  return {
    agent_name: name,
    voice_id: voiceId,
    voice_speed: 1.1,
    language: 'en-US',
    response_engine: { type: 'retell-llm', llm_id: llmId },
    interruption_sensitivity: 1.0,
    responsiveness: 1.0,
    ambient_sound: 'call-center',      // faint office room tone
    ambient_sound_volume: 0.3,
    enable_backchannel: false,
    max_call_duration_ms: 180000,      // 3 min hard cap
    end_call_after_silence_ms: 30000,
    post_call_analysis_model: 'gpt-4.1',
    webhook_url: POSTCALL_WEBHOOK,
    // VOICEMAIL LAW — leave a ~25s message, never hang up.
    voicemail_option: { action: { type: 'static_text', text: voicemailText } }
  };
}

/* ------------------------------------------------------------------ main -- */

const mode = process.argv[2] || '--show';
const md = readFileSync(join(ROOT, 'docs', 'demo-agent-prompt.md'), 'utf8');
const prompt = loadPrompt();
const voicemail = loadVoicemail(md);

function saveRegistry(reg) {
  mkdirSync(dirname(REGISTRY), { recursive: true });
  writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  console.log(`\nwrote ${REGISTRY.replace(ROOT, '.')}`);
}

if (mode === '--show') {
  console.log('--- prompt chars:', prompt.length);
  console.log('--- voicemail chars:', voicemail.length);
  console.log('--- voicemail text ---\n' + voicemail);
  console.log('\n--- prompt head ---\n' + prompt.slice(0, 600));
  process.exit(0);
}

if (mode === '--create') {
  const out = { created_at: new Date().toISOString(), run: 'RUN 1 · HEAR AVA LIVE', agents: {} };

  for (const [key, label, voice] of [
    ['brand', 'AVA HEAR-IT-LIVE v1', VOICE_BRAND],
    ['cartesia', 'AVA HEAR-IT-LIVE v1-CARTESIA', VOICE_CARTESIA]
  ]) {
    const llm = await call('POST', '/create-retell-llm', llmSpec(prompt));
    const agent = await call('POST', '/create-agent', agentSpec(label, voice, llm.llm_id, voicemail));
    out.agents[key] = {
      agent_name: label,
      agent_id: agent.agent_id,
      llm_id: llm.llm_id,
      version: agent.version,
      voice_id: voice,
      wired: key === 'brand' ? 'DEMO POOL outbound' : 'NONE — bake-off only, never on a public path'
    };
    console.log(`created ${label}\n  agent_id ${agent.agent_id}\n  llm_id   ${llm.llm_id}\n  version  ${agent.version}`);
  }

  out.prompt_source = 'docs/demo-agent-prompt.md (## ROLE -> EOF)';
  out.prompt_chars = prompt.length;
  out.voicemail_chars = voicemail.length;
  saveRegistry(out);
  process.exit(0);
}

if (mode === '--update') {
  if (!existsSync(REGISTRY)) { console.error('No automation/retell-agent-config.json — run --create first.'); process.exit(1); }
  const reg = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  for (const key of Object.keys(reg.agents)) {
    const a = reg.agents[key];
    await call('PATCH', `/update-retell-llm/${a.llm_id}`, { general_prompt: prompt });
    await call('PATCH', `/update-agent/${a.agent_id}`, {
      voicemail_option: { action: { type: 'static_text', text: voicemail } }
    });
    console.log(`updated ${a.agent_name} (${a.agent_id})`);
  }
  reg.updated_at = new Date().toISOString();
  reg.prompt_chars = prompt.length;
  saveRegistry(reg);
  process.exit(0);
}

console.error(`unknown mode ${mode} — use --create | --update | --show`);
process.exit(1);
