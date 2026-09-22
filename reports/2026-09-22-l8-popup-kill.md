===== SHANE READBACK — COPY ALL =====

🔒 READ ONLY — Claude Code (Dell) run report, L8 COCKPIT HYGIENE, 2026-09-22. Filed by the agent; do not edit.

[2026-09-22] — [CLAUDE CODE (DELL)] — [L8 COCKPIT HYGIENE · kill the terminal popups] — [🟢 COMPLETE]

WHAT I DID (plain English)
The windows flashing on the Dell were three of our own scheduled jobs: the metrics puller
(every 30 min, on the hour and half hour), the reports copier (every hour at :23) and the
Notion inbox puller (every hour at :30). Windows Terminal is this Dell's default terminal,
so every run opened a real window on screen — even the two jobs that asked to be hidden.
I caught all three in the act at 10:23 and 10:30. The cockpit had the same flaw at logon: it
opened a window, and closing that window killed the cockpit. It was down when I started.
I switched all four jobs to run with no window at all — same schedule, same account. I
stopped the idle Hermes gateway left over from the July WebUI trial and turned off its
startup entry. Then I ran every job by hand and watched the screen for 10 minutes: every
job did its work and zero windows appeared.

One honest note: the "every 2 minutes" rhythm never showed. I watched 18 minutes before the
fix (5 + 13) with a detector I first proved can see a window. The only windows in that time
were the three jobs above. If you still see a flash, run the watcher (NEXT, item 1) and it
will name the program that opened it.

DONE
| Task | Before | After | Proof |
|---|---|---|---|
| CockpitMetrics (GHL + Retell numbers) | Terminal window on screen every 30 min — caught 10:30:01 (1129×635, cmd.exe) | Runs windowless via `conhost.exe --headless`, still every 30 min | Run 10:32:40 → collect.log 10:32:43 "metrics collect done"; GHL, Retell, AI-cost fetched 10:32:41–43, ok=true (Doppler still resolves keys) |
| HermesBrainIngest (repo reports → vault) | Terminal window every hour at :23 — caught 10:23:01, despite `-WindowStyle Hidden` | Windowless, still hourly at :23 | Run 10:32:41 → ingest.log "ingested/updated 95 report(s)" |
| NotionInboxIngest (Notion inbox → vault) | Terminal window every hour at :30 — caught 10:30:01 (1129×635, powershell) | Windowless, still hourly at :30 | Run 10:32:42 → notion-inbox.log "Done: 0 ingested, 67 skipped, 0 failed" |
| Cockpit100X (the cockpit server) | Window at logon; closing it killed the cockpit (last exit 0xC000013A). Cockpit DOWN at run start | Windowless at logon — no window to close | Started 10:32:39; :4100 listening under `node ← cmd ← conhost --headless`; /api/metrics HTTP 200; page loads at 10:42:59 with 0 console errors; BUSINESS PULSE tiles read "10M OLD" (fetched after the fix) — calls 2/24h · 5/7d, bookings 1/7d, AI $9.99 left |
| Hermes gateway (Jul 13 WebUI trial, isolated home) | Running since 9/20, polling every 60 s; zero platforms, zero cron jobs, zero kanban tasks | Stopped (drained cleanly); Startup entry DISABLED, file kept | PID 11016 gone, no gateway process alive; StartupApproved flag = 03 (disabled) |
| Hermes cron jobs | 0 in the live home, 0 in the trial home | Nothing to pause | `hermes cron list --all` → "No scheduled jobs" (both homes) |
| 10-minute watch after the fix | 3 windows in the 13 min before | 0 new windows in 10 min | 10:32:32–10:42:32: 256 new processes, 0 new windows, 0 Windows Terminal spawns; all 4 jobs ran inside it as `svchost → conhost --headless → job` |
| Vendor tasks + startup keys (HP, Omen, Adobe, Google, Dropbox, OneDrive, Realtek, Logitech, Notion, Perplexity, Wondershare…) | Untouched | Untouched — Shane decided 2026-09-22: leave them | None opened a window in 28 minutes of watching |

FIND — what is on this Dell (verdicts)
- KEEP-HIDDEN: Cockpit100X (logon) · CockpitMetrics (30 min) · HermesBrainIngest (hourly :23) · NotionInboxIngest (hourly :30).
- KILL: the Hermes gateway (pythonw, launched by Startup\Hermes_Gateway.vbs → the trial home's
  gateway-service VBS). It is a Hermes poller under 5 minutes (60 s housekeeping + 60 s kanban
  dispatcher + cron ticker) — kill-on-sight per the Aug 12 canon. It never spawned a process.
- Nothing on the Dell is tied to the 100X Lead Response Loop (cockpit remote missions both empty).
- WSL is not installed. Task Scheduler history logging is off (so there is no older record).
- LEFT UNTOUCHED (Shane decided 2026-09-22): 25 enabled vendor scheduled tasks and 15 startup Run keys,
  plus 2 OneDrive RunOnce `cmd /q /c del` lines that will flash one console once at the next logon and
  then remove themselves.

IDS / ROLLBACK
- Backups: `C:\Users\offic\100x-cockpit\backup\tasks-2026-09-22\` — the 4 task XMLs as they were,
  the gateway Startup VBS, its before-state, fix/prove output, the before logs, and `popup-watch.ps1`.
- Restore any task exactly as it was (each command tested this run on a disabled copy — all 4
  register from this non-elevated account with the original action):
  $b='C:\Users\offic\100x-cockpit\backup\tasks-2026-09-22'
  Register-ScheduledTask -TaskName 'Cockpit100X' -TaskPath '\' -Xml (Get-Content -LiteralPath "$b\Cockpit100X.xml" -Raw) -Force
  Register-ScheduledTask -TaskName 'CockpitMetrics' -TaskPath '\' -Xml (Get-Content -LiteralPath "$b\CockpitMetrics.xml" -Raw) -Force
  Register-ScheduledTask -TaskName 'HermesBrainIngest' -TaskPath '\' -Xml (Get-Content -LiteralPath "$b\HermesBrainIngest.xml" -Raw) -Force
  Register-ScheduledTask -TaskName 'NotionInboxIngest' -TaskPath '\' -Xml (Get-Content -LiteralPath "$b\NotionInboxIngest.xml" -Raw) -Force
- Restore the Hermes gateway (no scheduled task was disabled, so this is the only KILL rollback):
  Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder' -Name 'Hermes_Gateway.vbs' -Value ([byte[]](2,0,0,0,0,0,0,0,0,0,0,0))
  wscript.exe "C:\Users\offic\hermes-webui-run\home\gateway-service\Hermes_Gateway.vbs"
  (Or Task Manager → Startup apps → Hermes_Gateway.vbs → Enable.)
- Repo: board.json L8 + this report (this commit). No site files changed.

NEXT / NEEDS SHANE
1. If a window ever flashes again, run this and read the WIN lines — each one names the program behind it:
   pwsh -NoProfile -File C:\Users\offic\100x-cockpit\backup\tasks-2026-09-22\popup-watch.ps1 -Seconds 600 -Out $HOME\popup-watch.log
   Select-String -Path $HOME\popup-watch.log -Pattern "`tWIN`t"
2. Still open from before (not this run): GSC OAuth for the BUSINESS PULSE search tile; the Hermes
   WebUI trial folders (`hermes-webui`, `hermes-webui-run`) are still on disk, not running — delete or promote.

GOTCHAS
1. With Windows Terminal as the default terminal, `powershell -WindowStyle Hidden` from Task
   Scheduler still opens a FULL window (measured 1129×635). Only `conhost.exe --headless` ran with
   no window at all in the calibration.
2. `conhost.exe --headless` always exits 0 — it swallowed exit codes 7, 3 and 0 alike in testing.
   LastTaskResult now reads 0 even if a job fails. Judge a job by its log file, not by that number.
   (Cockpit100X reads 0x41301 = still running, which is correct for a server.)
3. The brief's preferred fix (S4U, "run whether logged on or not") was refused: "Access is denied"
   from this non-elevated session. It would likely also cut Doppler off: its token lives in Windows
   Credential Manager, and Microsoft limits a no-stored-password (S4U) job to local resources. Not
   measured — the probe task could not be registered, so it never ran.
4. The cockpit's server.log has `^C[` glued to boot lines. Each `^C` is a time the cockpit window was
   closed and the cockpit died. There will be no new ones now — there is no window to close.
5. PowerShell variable names ignore case: a loop's `$t` silently overwrote `$T` (the fix time) in my
   first proof pass and every freshness check errored. Renamed and re-ran; the numbers above are the re-run.
6. HermesBrainIngest reports "ingested/updated 95 report(s)" every hour — its skip-if-unchanged
   check is not matching, so it rewrites all 95 files into OneDrive hourly. Harmless; not touched.
7. A second Claude Code session was live on the Dell during this run (the AI100X phone cockpit
   build) and ran the collector by hand at 10:11. The watcher tags every process by the session that
   started it, so that traffic never counted as a popup.
