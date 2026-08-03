# -*- coding: utf-8 -*-
"""WF-RATE pricing battery. Engine-level. Dialogue cases wait for Conductor."""
import io, json, sys
from rate_call import call

WED = '2026-08-05T14:00:00'   # Wednesday -> weekday
FRI = '2026-08-07T14:00:00'   # Friday    -> weekend
SAT = '2026-08-08T14:00:00'   # Saturday  -> weekend
LATE = '2026-08-05T23:30:00'  # Wednesday 23:30 -> late_night auto
XMAS = '2026-12-25T14:00:00'  # holiday

def A(cid, **kw):
    a = {'call_id': cid, 'tenant_id': 'demo'}
    a.update(kw)
    return {'name': 'rate_lookup', 'call': {'call_id': cid}, 'args': a}

CASES = []
def C(n, desc, body, expect, mode='hmac', bad=False):
    CASES.append({'n': n, 'desc': desc, 'body': body, 'expect': expect, 'mode': mode, 'bad': bad})

# --- AIRPORT pricing ---
C(1, 'Airport sedan_exec DowntownMKE-MKE weekday', A('b01', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED), {'status':'QUOTED','all_in_total':78,'base_amount':65})
C(2, 'Airport sedan_luxury x1.45 + round5', A('b02', trip_type='airport', vehicle_key='sedan_luxury', origin='DowntownMKE', airport='MKE', pickup_at=WED), {'status':'QUOTED','all_in_total':114,'base_amount':95})
C(3, 'Airport suv_exec Waukesha-MKE (suv base)', A('b03', trip_type='airport', vehicle_key='suv_exec', origin='Waukesha', airport='MKE', pickup_at=WED), {'status':'QUOTED','all_in_total':162,'base_amount':135})
C(4, 'Airport suv_premium x1.25 round5', A('b04', trip_type='airport', vehicle_key='suv_premium', origin='Waukesha', airport='MKE', pickup_at=WED), {'status':'QUOTED','all_in_total':204,'base_amount':170})
C(5, 'Airport van_exec x1.35 Milwaukee-ORD', A('b05', trip_type='airport', vehicle_key='van_exec', origin='Milwaukee', airport='ORD', pickup_at=WED), {'status':'QUOTED','all_in_total':462,'base_amount':385})
C(6, 'Airport sprinter_exec_14 x1.55 Madison-ORD', A('b06', trip_type='airport', vehicle_key='sprinter_exec_14', origin='Madison', airport='ORD', pickup_at=WED), {'status':'QUOTED','all_in_total':732,'base_amount':610})
C(7, 'Airport sprinter_luxury x1.85 GreenBay-MKE', A('b07', trip_type='airport', vehicle_key='sprinter_luxury', origin='GreenBay', airport='MKE', pickup_at=WED), {'status':'QUOTED','all_in_total':780,'base_amount':650})
C(8, 'Airport DEMO_SEED zone Kenosha-ORD sedan', A('b08', trip_type='airport', vehicle_key='sedan_exec', origin='Kenosha', airport='ORD', pickup_at=WED), {'status':'QUOTED','all_in_total':180,'base_amount':150})
C(9, 'Airport origin case/space insensitive', A('b09', trip_type='airport', vehicle_key='sedan_exec', origin='downtown mke', airport='mke', pickup_at=WED), {'status':'QUOTED','all_in_total':78})

# --- NO_ROUTE_FOUND: never estimate, never nearest-city ---
C(10, 'Unknown origin -> NO_ROUTE_FOUND', A('b10', trip_type='airport', vehicle_key='sedan_exec', origin='Oshkosh', airport='MKE', pickup_at=WED), {'status':'NO_ROUTE_FOUND','all_in_total':None})
C(11, 'Unknown airport -> NO_ROUTE_FOUND', A('b11', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='JFK', pickup_at=WED), {'status':'NO_ROUTE_FOUND','all_in_total':None})

# --- airport classes that must escalate ---
C(12, 'Airport limo_stretch -> HUMAN_REVIEW_REQUIRED', A('b12', trip_type='airport', vehicle_key='limo_stretch', origin='DowntownMKE', airport='MKE', pickup_at=WED), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})
C(13, 'Airport party_bus_30 -> HUMAN_REVIEW_REQUIRED', A('b13', trip_type='airport', vehicle_key='party_bus_30', origin='Milwaukee', airport='ORD', pickup_at=WED), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})
C(14, 'Airport motorcoach_56 -> HUMAN_REVIEW_REQUIRED', A('b14', trip_type='airport', vehicle_key='motorcoach_56', origin='Milwaukee', airport='ORD', pickup_at=WED), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})

# --- HOURLY pricing + minimums ---
C(15, 'Hourly sedan_exec 3h weekday', A('b15', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=3, pickup_at=WED), {'status':'QUOTED','all_in_total':270,'base_amount':225})
C(16, 'Hourly minimum lifts 1h -> 2h weekday', A('b16', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=1, pickup_at=WED), {'status':'QUOTED','all_in_total':180,'base_amount':150})
C(17, 'Hourly weekend rate + minimum (Sat)', A('b17', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=1, pickup_at=SAT), {'status':'QUOTED','all_in_total':204,'base_amount':170})
C(18, 'Friday counts as weekend', A('b18', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=2, pickup_at=FRI), {'status':'QUOTED','all_in_total':204,'base_amount':170})
C(19, 'Hourly limo_hummer 2h Sat -> min 4', A('b19', trip_type='hourly', vehicle_key='limo_hummer', requested_hours=2, pickup_at=SAT), {'status':'QUOTED','all_in_total':1080,'base_amount':900})
C(20, 'Hourly party_bus_40 3h Sat -> min 4', A('b20', trip_type='hourly', vehicle_key='party_bus_40', requested_hours=3, pickup_at=SAT), {'status':'QUOTED','all_in_total':1560,'base_amount':1300})
C(21, 'Hourly motorcoach_56 4h Wed -> min 5', A('b21', trip_type='hourly', vehicle_key='motorcoach_56', requested_hours=4, pickup_at=WED), {'status':'QUOTED','all_in_total':1170,'base_amount':975})
C(22, 'Hourly sprinter_luxury 3h Fri -> min 4 weekend', A('b22', trip_type='hourly', vehicle_key='sprinter_luxury', requested_hours=3, pickup_at=FRI), {'status':'QUOTED','all_in_total':840,'base_amount':700})
C(23, 'Hourly limo_stretch IS priceable (only airport escalates)', A('b23', trip_type='hourly', vehicle_key='limo_stretch', requested_hours=3, pickup_at=WED), {'status':'QUOTED','all_in_total':486,'base_amount':405})

# --- quote-only fleet ---
C(24, 'quote_only van_ada hourly -> review', A('b24', trip_type='hourly', vehicle_key='van_ada', requested_hours=3, pickup_at=WED), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})
C(25, 'quote_only mini_coach_38 airport -> review', A('b25', trip_type='airport', vehicle_key='mini_coach_38', origin='DowntownMKE', airport='MKE', pickup_at=WED), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})
C(26, 'quote_only motorcoach_premium -> review', A('b26', trip_type='hourly', vehicle_key='motorcoach_premium', requested_hours=6, pickup_at=WED), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})

# --- corporate / affiliate / farm-out: never a retail number ---
C(27, 'account_type corporate -> CORPORATE_RATE_REQUIRED', A('b27', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED, account_type='corporate'), {'status':'CORPORATE_RATE_REQUIRED','all_in_total':None})
C(28, 'affiliate flag -> CORPORATE_RATE_REQUIRED', A('b28', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=3, pickup_at=WED, affiliate=True), {'status':'CORPORATE_RATE_REQUIRED','all_in_total':None})
C(29, 'farm_out flag -> CORPORATE_RATE_REQUIRED', A('b29', trip_type='hourly', vehicle_key='suv_exec', requested_hours=3, pickup_at=WED, farm_out=True), {'status':'CORPORATE_RATE_REQUIRED','all_in_total':None})

# --- pricing_mode gate ---
C(30, 'CAPTURE_ONLY -> rate_source none', A('b30', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED, pricing_mode='CAPTURE_ONLY'), {'status':'CAPTURE_ONLY','all_in_total':None,'rate_source':'none'})

# --- add-ons ---
C(31, 'meet_greet +25', A('b31', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED, addons=[{'key':'meet_greet'}]), {'status':'QUOTED','all_in_total':103})
C(32, 'curbside +0', A('b32', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED, addons=[{'key':'curbside'}]), {'status':'QUOTED','all_in_total':78})
C(33, 'child_seat x2 with seat_type +40', A('b33', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED, addons=[{'key':'child_seat','qty':2,'seat_type':'booster'}]), {'status':'QUOTED','all_in_total':118})
C(34, 'child_seat without seat_type -> INPUT_INCOMPLETE', A('b34', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED, addons=[{'key':'child_seat','qty':1}]), {'status':'INPUT_INCOMPLETE','all_in_total':None})
C(35, 'late_night auto-applied at 23:30 +30', A('b35', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=LATE), {'status':'QUOTED','all_in_total':108})
C(36, 'more than 3 stops -> HUMAN_REVIEW_REQUIRED', A('b36', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED, stops_count=4), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})
C(37, 'holiday pickup -> HUMAN_REVIEW_REQUIRED', A('b37', trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=XMAS), {'status':'HUMAN_REVIEW_REQUIRED','all_in_total':None})

# --- missing input ---
C(38, 'missing trip_type -> INPUT_INCOMPLETE', A('b38', vehicle_key='sedan_exec', pickup_at=WED), {'status':'INPUT_INCOMPLETE'})
C(39, 'missing pickup_at -> INPUT_INCOMPLETE', A('b39', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=3), {'status':'INPUT_INCOMPLETE'})
C(40, 'missing requested_hours -> INPUT_INCOMPLETE', A('b40', trip_type='hourly', vehicle_key='sedan_exec', pickup_at=WED), {'status':'INPUT_INCOMPLETE'})
C(41, 'unknown vehicle_key -> INPUT_INCOMPLETE', A('b41', trip_type='hourly', vehicle_key='spaceship', requested_hours=3, pickup_at=WED), {'status':'INPUT_INCOMPLETE'})

# --- auth ---
C(42, 'no auth header -> 401', A('b42', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=3, pickup_at=WED), {'status':'UNAUTHORIZED','http':401}, mode='none')
C(43, 'bad HMAC -> 401', A('b43', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=3, pickup_at=WED), {'status':'UNAUTHORIZED','http':401}, mode='hmac', bad=True)
C(44, 'bad shared secret -> 401', A('b44', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=3, pickup_at=WED), {'status':'UNAUTHORIZED','http':401}, mode='shared', bad=True)
C(45, 'valid shared secret -> QUOTED', A('b45', trip_type='hourly', vehicle_key='sedan_exec', requested_hours=3, pickup_at=WED), {'status':'QUOTED','all_in_total':270}, mode='shared')


def check(resp, http, exp):
    fails = []
    if 'http' in exp and http != exp['http']:
        fails.append('http %s != %s' % (http, exp['http']))
    for k, want in exp.items():
        if k == 'http':
            continue
        got = resp.get(k)
        if got != want:
            fails.append('%s=%r want %r' % (k, got, want))
    # universal invariants on a priced quote
    if resp.get('status') == 'QUOTED':
        if resp.get('gratuity_included') is not True:
            fails.append('gratuity_included not true')
        s = sum(round(float(b.get('amount', 0)), 2) for b in resp.get('breakdown', []))
        if abs(s - float(resp.get('all_in_total', 0))) > 0.005:
            fails.append('breakdown sums to %s but all_in_total=%s' % (s, resp.get('all_in_total')))
    if resp.get('status') in ('NO_ROUTE_FOUND', 'CORPORATE_RATE_REQUIRED', 'HUMAN_REVIEW_REQUIRED', 'CAPTURE_ONLY'):
        if resp.get('all_in_total') is not None:
            fails.append('leaked a retail number on %s' % resp.get('status'))
    return fails


def main():
    results = []
    for c in CASES:
        http, resp = call(c['body'], mode=c['mode'], bad_sig=c['bad'])
        fails = check(resp, http, c['expect'])
        results.append((c['n'], c['desc'], 'PASS' if not fails else 'FAIL', fails, resp))

    # --- stateful: idempotency + supersede ---
    cid = 'b46_idem'
    b = A(cid, trip_type='airport', vehicle_key='sedan_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED)
    h1, r1 = call(b)
    h2, r2 = call(b)
    f = []
    if r1.get('quote_id') != r2.get('quote_id'):
        f.append('replay produced a new quote_id: %s vs %s' % (r1.get('quote_id'), r2.get('quote_id')))
    if r2.get('all_in_total') != 78:
        f.append('replay total %s' % r2.get('all_in_total'))
    results.append((46, 'Idempotency: identical inputs on same call_id reuse quote_id', 'PASS' if not f else 'FAIL', f, r2))

    b3 = A(cid, trip_type='airport', vehicle_key='suv_exec', origin='DowntownMKE', airport='MKE', pickup_at=WED)
    h3, r3 = call(b3)
    f = []
    if r3.get('quote_id') == r1.get('quote_id'):
        f.append('correction reused the old quote_id')
    if not r3.get('superseded_quote_id'):
        f.append('superseded_quote_id not returned')
    if r3.get('all_in_total') != 114:
        f.append('corrected total %s want 114' % r3.get('all_in_total'))
    results.append((47, 'Correction re-call: new quote_id + prior SUPERSEDED', 'PASS' if not f else 'FAIL', f, r3))

    npass = sum(1 for r in results if r[2] == 'PASS')
    print('=' * 104)
    print('WF-RATE PRICING BATTERY  ---  %d/%d PASS' % (npass, len(results)))
    print('=' * 104)
    for n, desc, st, fails, resp in results:
        line = '%-4s %-6s %-62s' % (n, st, desc[:62])
        if st == 'PASS':
            extra = resp.get('status', '')
            if resp.get('all_in_total') is not None:
                extra += ' $%s' % resp.get('all_in_total')
            print(line + ' ' + extra)
        else:
            print(line + ' ' + '; '.join(fails)[:150])
    print('=' * 104)
    with io.open('battery_results.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps([{'n': n, 'desc': d, 'status': s, 'fails': f, 'resp': r} for n, d, s, f, r in results], indent=2))
    return 0 if npass == len(results) else 1


if __name__ == '__main__':
    sys.exit(main())
