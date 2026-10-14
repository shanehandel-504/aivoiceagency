# Latency baseline — 2026-10-13 (CC-AVA-DISCOVERY-PREP-v2, READ ONLY)

The BEFORE number for the speed gate. The words run reruns the same query after.

Query, per agent: `POST /v3/list-calls` · filter_criteria `{agent_id:[id], call_type:{type:'enum',op:'in',value:['phone_call']}, call_status:{type:'enum',op:'in',value:['ended']}, duration_ms:{type:'number',op:'ge',value:30000}}` · sort_order descending · limit 20 · read 2026-10-14T03:57:57.133Z. Latency values are milliseconds from each call object's `latency` block (`e2e`, `llm`, `tts`). The call object carries no LLM model field, so the model column is read from the agent version the call ran on (marked "from version"). "Line" = our number's last four. Times are Central.

### AVA …8930 agent (`agent_d5ada9f774fe3ae7f034d2c677`) — 20 call(s) returned

| Call | Start (Central) | Duration | Dir | Line | Ver | e2e p50 | e2e p90 | e2e p95 | LLM p50 | TTS p50 | LLM model |
|---|---|---|---|---|---|---|---|---|---|---|---|
| …3e3ff5 | 10/13/2026, 15:43:31 | 87 s | inbound | …1886 | v51 | 1224 | 2294 | 2480 | 630 | 66 | gpt-4.1 (from version) |
| …236bb4 | 10/09/2026, 11:54:39 | 31 s | inbound | …8930 | v51 | 1496 | 1523 | 1527 | 872 | 65 | gpt-4.1 (from version) |
| …55367b | 10/06/2026, 15:45:42 | 95 s | inbound | …8930 | v49 | 1087 | 1089 | 1090 | 825 | 70 | gpt-4.1 (from version) |
| …7196eb | 09/14/2026, 11:36:21 | 231 s | inbound | …8930 | v49 | 1479 | 2294 | 2558 | 841 | 77 | gpt-4.1 (from version) |
| …ee98e9 | 09/14/2026, 11:34:20 | 89 s | inbound | …8930 | v49 | 1757 | 2877 | 2947 | 687 | 79 | gpt-4.1 (from version) |
| …820cba | 08/31/2026, 10:58:18 | 158 s | inbound | …8930 | v49 | 2250 | 2794 | 3168 | 719 | 121 | gpt-4.1 (from version) |
| …805024 | 08/28/2026, 20:14:08 | 71 s | inbound | …6486 | v48 | absent | absent | absent | 336 | 70 | gpt-4.1 (from version) |
| …f8cedf | 08/23/2026, 21:49:33 | 52 s | inbound | …8930 | v48 | 904 | 959 | 962 | 633 | 66 | gpt-4.1 (from version) |
| …93dba6 | 08/19/2026, 22:53:34 | 131 s | inbound | …8930 | v48 | 1006 | 1918 | 2141 | 605 | 113 | gpt-4.1 (from version) |
| …98bf46 | 08/19/2026, 19:19:12 | 175 s | inbound | …8930 | v46 | 1055 | 2480 | 3162 | 662 | 118 | gpt-4.1 (from version) |
| …3f99e1 | 08/19/2026, 15:51:46 | 31 s | inbound | …1886 | v46 | 3023 | 3023 | 3023 | 708 | 122 | gpt-4.1 (from version) |
| …4067d2 | 08/19/2026, 11:10:32 | 31 s | inbound | …8930 | v46 | 3168 | 3168 | 3168 | 1420 | 117 | gpt-4.1 (from version) |
| …b228cf | 08/18/2026, 14:11:23 | 237 s | inbound | …8930 | v44 | 1344 | 1834 | 2452 | 728 | 80 | gpt-4.1 (from version) |
| …01d253 | 08/18/2026, 13:38:57 | 220 s | inbound | …8930 | v43 | 1307 | 2639 | 2696 | 780 | 119 | gpt-4.1 (from version) |
| …7a2981 | 08/17/2026, 18:06:44 | 180 s | inbound | …8930 | v41 | 1455 | 2273 | 2887 | 791 | 113 | gpt-4.1 (from version) |
| …7fa162 | 08/17/2026, 11:14:54 | 256 s | inbound | …8930 | v40 | 1220 | 2310 | 2587 | 642 | 124 | gpt-4.1 (from version) |
| …e788e4 | 08/11/2026, 20:43:39 | 102 s | inbound | …8930 | v39 | 1170 | 1579 | 1688 | 823 | 114 | gpt-4.1 (from version) |
| …eb2d50 | 08/11/2026, 18:59:19 | 184 s | outbound | …8930 | v38 | 1353 | 1656 | 1766 | 739 | 196 | gpt-4.1 (from version) |
| …ff5ebc | 08/08/2026, 14:42:22 | 180 s | inbound | …8930 | v38 | 1236 | 1595 | 1966 | 783 | 191 | gpt-4.1 (from version) |
| …ebed73 | 08/08/2026, 14:27:13 | 144 s | inbound | …8930 | v38 | 1349 | 1612 | 1728 | 762 | 200 | gpt-4.1 (from version) |

**Median of e2e p50: 1344 ms · median of e2e p90: 2273 ms · worst single e2e p90: 3168 ms (call …4067d2).** Calls with no `e2e` key are left out of the medians: …805024.

### AI Chauffeur …0019 agent (`agent_9ebb41c9bd8af214649328f107`) — 2 call(s) returned (fewer than 20 exist)

| Call | Start (Central) | Duration | Dir | Line | Ver | e2e p50 | e2e p90 | e2e p95 | LLM p50 | TTS p50 | LLM model |
|---|---|---|---|---|---|---|---|---|---|---|---|
| …0750b1 | 10/09/2026, 11:55:59 | 38 s | inbound | …0019 | v13 | absent | absent | absent | 2 | 59 | gpt-4.1 (fast tier) (from version) |
| …f64647 | 10/05/2026, 11:29:15 | 220 s | inbound | …0019 | v13 | absent | absent | absent | 2 | 94 | gpt-4.1 (fast tier) (from version) |

**Median of e2e p50: not computable · median of e2e p90: not computable · worst single e2e p90: not computable — the `latency` block on all 2 calls has no `e2e` key (keys present: llm, tts, asr).** LLM p50 and TTS p50 are shown as the block gives them.
