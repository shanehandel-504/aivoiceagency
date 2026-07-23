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

/* ---------------------------------------------------------- DEPLOY PATCHES --
 * RUN 1.6 · SCRIPT v3 — EMPTY BY DESIGN.
 *
 * The doc is now the ONE source of truth and ships BYTE-FOR-BYTE. Run 1.5's
 * 2-entry patch table (which rewrote the Stage-4 dashboard promise) is retired:
 * v3 carries its own INTERIM ACTIVE VARIANT, so the interim wording lives in the
 * script itself rather than in a substitution table. `--verify` byte-compares
 * the live prompt against the file, which is only meaningful while this is empty.
 *
 * If a patch is ever re-added it MUST match exactly once, or the deploy aborts.
 * -------------------------------------------------------------------------- */
const DEPLOY_PATCHES = [];

function between(md, tag) {
  const re = new RegExp('<!-- ' + tag + ':BEGIN[\\s\\S]*?-->([\\s\\S]*?)<!-- ' + tag + ':END -->');
  const m = md.match(re);
  if (!m) throw new Error(`docs/demo-agent-prompt.md is missing the ${tag}:BEGIN/END markers.`);
  return m[1].trim();
}

/* The verbatim script, exactly as committed. */
function loadPromptRaw() {
  return between(readFileSync(join(ROOT, 'docs', 'demo-agent-prompt.md'), 'utf8'), 'PROMPT');
}

/* What actually ships to Retell = verbatim script + DEPLOY_PATCHES. */
function loadPrompt() {
  let p = loadPromptRaw();
  for (const patch of DEPLOY_PATCHES) {
    const hits = p.split(patch.from).length - 1;
    if (hits !== 1) {
      throw new Error(
        `DEPLOY PATCH did not match exactly once (found ${hits}).\n` +
        `  why: ${patch.why}\n  from: ${patch.from.slice(0, 90)}...\n` +
        'The doc changed. Reconcile DEPLOY_PATCHES before deploying.'
      );
    }
    p = p.replace(patch.from, patch.to);
  }
  return p;
}

/* Voicemail lives in its own marker block so the two can never drift. */
function loadVoicemail(md) {
  return between(md, 'VOICEMAIL').replace(/\s+/g, ' ').trim();
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
    // Fallbacks for every variable the script interpolates. These exist so a
    // failed scrape can never put a literal {{token}} or an empty hole into
    // AVA's mouth mid-sentence. n8n normally supplies all of them; these only
    // fire if a variable is missing entirely.
    //
    // NOTE on scraped_fact: STAGE_2 says "and I saw {{scraped_fact}}", so this
    // value becomes a claim about the prospect's site. It must therefore never
    // be a specific invented fact (no numbers, no years, no guarantees) —
    // CLAUDE.md bans fabricated proof. n8n derives a TRUE one from the page it
    // actually read; this is the conservative floor.
    default_dynamic_variables: {
      first_name: 'there',
      company_name: 'your business',
      website_url: 'your website',
      city: 'your area',
      service_1: 'the work you do',
      service_2: 'more',
      scraped_fact: 'you list your services right up front',
      services_typed: 'the work you do'
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
  console.log('--- deploy patches applied:', DEPLOY_PATCHES.length);
  console.log('\n--- voicemail text ---\n' + voicemail);
  console.log('\n--- DEPLOYED prompt ---\n' + prompt);
  process.exit(0);
}

/* --diff — show doc-vs-deployed, and what Retell is actually serving now. */
if (mode === '--diff') {
  const raw = loadPromptRaw();
  console.log('=== DOC (Run-2-final) vs DEPLOYED ===');
  for (const p of DEPLOY_PATCHES) {
    console.log('\n  WHY : ' + p.why);
    console.log('  DOC : ' + p.from);
    console.log('  LIVE: ' + p.to);
  }
  console.log('\ndoc chars %d -> deployed chars %d'.replace('%d', raw.length).replace('%d', prompt.length));

  if (existsSync(REGISTRY)) {
    const reg = JSON.parse(readFileSync(REGISTRY, 'utf8'));
    for (const key of Object.keys(reg.agents)) {
      const a = reg.agents[key];
      const live = await call('GET', `/get-retell-llm/${a.llm_id}`);
      const gp = live.general_prompt || '';
      console.log(`\n${a.agent_name} (${a.llm_id})`);
      console.log('  live chars      : ' + gp.length);
      console.log('  matches deployed: ' + (gp.trim() === prompt.trim()));
      console.log('  dashboard claim : ' + (/dashboard/i.test(gp) ? 'PRESENT -- BAD' : 'absent (correct)'));
      console.log('  ghost tool ref  : ' + (/trigger_dashboard_sms/.test(gp) ? 'PRESENT -- BAD' : 'absent (correct)'));
    }
  }
  process.exit(0);
}

/* --verify — GET both agents back and BYTE-COMPARE the live prompt to the file.
   Exits non-zero on any mismatch so CI / a run script can gate on it. */
if (mode === '--verify') {
  if (!existsSync(REGISTRY)) { console.error('No automation/retell-agent-config.json — run --create first.'); process.exit(1); }
  const reg = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  let allPass = true;

  console.log('=== SCRIPT v3 BYTE-MATCH VERIFY ===');
  console.log(`file: docs/demo-agent-prompt.md (PROMPT markers) — ${prompt.length} chars`);
  console.log(`deploy patches applied: ${DEPLOY_PATCHES.length} (must be 0 for a true byte-match)\n`);

  for (const key of Object.keys(reg.agents)) {
    const a = reg.agents[key];
    const agent = await call('GET', `/get-agent/${a.agent_id}`);
    const llmVer = agent.response_engine && agent.response_engine.version;
    const llm = await call('GET', `/get-retell-llm/${a.llm_id}` + (llmVer !== undefined ? `?version=${llmVer}` : ''));
    const live = llm.general_prompt || '';

    const match = live === prompt;
    if (!match) allPass = false;

    console.log(`${a.agent_name}`);
    console.log(`  agent_id   : ${a.agent_id}`);
    console.log(`  llm_id     : ${a.llm_id}  (llm v${llmVer})`);
    console.log(`  agent ver  : v${agent.version}  published=${agent.is_published}`);
    console.log(`  live chars : ${live.length}   file chars: ${prompt.length}`);
    console.log(`  BYTE-MATCH : ${match ? 'PASS' : 'FAIL'}`);
    // Prove the v3 markers actually landed, not just that lengths agree.
    console.log(`  v3 markers : STAGE_1-open="${/Am I coming through clear/.test(live)}" ` +
                `interim-variant="${/INTERIM ACTIVE VARIANT/.test(live)}" ` +
                `stage5-exit="${/It should be right there/.test(live)}"`);
    if (!match) {
      for (let i = 0; i < Math.max(live.length, prompt.length); i++) {
        if (live[i] !== prompt[i]) {
          console.log(`  first diff at char ${i}:`);
          console.log(`    file: ${JSON.stringify(prompt.slice(Math.max(0, i - 40), i + 40))}`);
          console.log(`    live: ${JSON.stringify(live.slice(Math.max(0, i - 40), i + 40))}`);
          break;
        }
      }
    }
    console.log('');
  }

  console.log(`OVERALL: ${allPass ? 'PASS — both agents byte-match the file' : 'FAIL — see diffs above'}`);
  process.exit(allPass ? 0 : 1);
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
  const spec = llmSpec(prompt);

  for (const key of Object.keys(reg.agents)) {
    const a = reg.agents[key];

    /* Retell PUBLISHED versions are IMMUTABLE — a PATCH against one returns
       400 "Cannot update published LLM". The documented edit path is:
         1. fork an editable draft off the current version
         2. PATCH the LLM + the agent on that draft
         3. publish the draft (which publishes the linked LLM too)
       See retell-backups/README.md. */
    const live = await call('GET', `/get-agent/${a.agent_id}`);
    const base = live.version;

    let draft = live;
    if (live.is_published) {
      draft = await call('POST', `/create-agent-version/${a.agent_id}`, { base_version: base });
      console.log(`  forked ${a.agent_name}: v${base} -> editable v${draft.version}`);
    }
    const ver = draft.version;

    await call('PATCH', `/update-retell-llm/${a.llm_id}?version=${draft.response_engine.version}`, {
      general_prompt: prompt,
      default_dynamic_variables: spec.default_dynamic_variables,
    });
    await call('PATCH', `/update-agent/${a.agent_id}?version=${ver}`, {
      voicemail_option: { action: { type: 'static_text', text: voicemail } },
    });
    await call('POST', `/publish-agent-version/${a.agent_id}`, { version: ver });

    a.version = ver;
    console.log(`updated + published ${a.agent_name} (${a.agent_id}) -> v${ver}`);
  }

  reg.updated_at = new Date().toISOString();
  reg.prompt_chars = prompt.length;
  reg.prompt_source = 'docs/demo-agent-prompt.md (PROMPT:BEGIN/END markers) + DEPLOY_PATCHES';
  reg.deploy_patches = DEPLOY_PATCHES.map((p) => p.why);
  saveRegistry(reg);
  process.exit(0);
}

console.error(`unknown mode ${mode} — use --create | --update | --show | --diff | --verify`);
process.exit(1);
