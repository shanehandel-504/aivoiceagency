# Edit list + captions + trip-sheet events + callouts for one sample call. Writes data.json and call_cut.wav in the working dir.
# CALL=airport python3 build_data.py   (SEG, fields and callouts below are the airport cut; edit them per call)
import json, os, numpy as np, wave, subprocess
HERE=os.path.dirname(os.path.abspath(__file__))
CALL=os.environ.get('CALL','airport')
D=json.load(open(os.environ.get('CALL_JSON',f'{HERE}/calls/{CALL}.json')))
PICK=D['pickup']
SEG=[(2.00,6.08),(6.25,15.97),(17.80,23.55),(58.30,62.10),(65.85,66.75)]
END=3.0; FPS=30
# vt offsets
vt0=[];acc=0
for a,b in SEG: vt0.append(acc); acc+=b-a
CALL_END=acc; TOTAL=acc+END
def st2vt(st):
    for (a,b),o in zip(SEG,vt0):
        if a-1e-6<=st<=b+1e-6: return o+(st-a)
    return None
# display fixes
FIX={"940.":"9:40.","booked!":"booked.","Inside":"inside","Baggage":"baggage","Claim":"claim"}
caps=[]
for ti,t in enumerate(D['turns']):
    ws=[]
    i=0; W=t['words']
    while i<len(W):
        w=dict(W[i])
        if w['w']=='O' and i+1<len(W) and W[i+1]['w'].startswith("'"):
            w={'w':"O"+W[i+1]['w'],'s':W[i]['s'],'e':W[i+1]['e']}; i+=1
        w['w']=FIX.get(w['w'],w['w'])
        ws.append(w); i+=1
    for si,(a,b) in enumerate(SEG):
        inseg=[w for w in ws if w['s']>=a-0.02 and w['e']<=b+0.05]
        if not inseg: continue
        words=[{'w':w['w'],'s':round(st2vt(max(w['s'],a)),3)} for w in inseg]
        caps.append({'who':t['who'],'s':words[0]['s']-0.08,'e':round(vt0[si]+ (b-a),3) if True else 0,'words':words,'seg':si})
# caption end = start of next caption or segment end
caps.sort(key=lambda c:c['s'])
for i,c in enumerate(caps):
    nxt=caps[i+1]['s'] if i+1<len(caps) else CALL_END
    c['e']=round(min(nxt, vt0[c['seg']]+SEG[c['seg']][1]-SEG[c['seg']][0]+0.6),3)
# fix 'which airline' not included (cut) -> handled by seg filter
v=lambda st: round(st2vt(st),3)
cas=v(58.30)+0.12
fields=[
 ('PICKUP',"O'Hare, tonight", v(7.80)),
 ('DROP-OFF','Evanston', v(9.02)),
 ('VEHICLE','Sedan', v(11.0)),
 ('RATE','$115 + tolls, gratuity', v(13.05)),
 ('FLIGHT','United 1242 · lands 9:40', v(18.13)),
 ('TRACKING','On · pickup moves with it', v(21.29)),
 ('BAGS','3 · one golf bag', cas),
 ('MEET','Inside, baggage claim', cas+0.14),
 ('DROP-OFF','1820 Hinman Ave, Evanston', cas+0.28),
 ('PASSENGER','Mark Delaney', cas+0.42),
 ('RECEIPT','Text + email', v(65.95)),
]
F=[{'k':k,'v':val,'t':t} for k,val,t in fields]
callouts=[
 {'t':round(st2vt(PICK)+0.15,3),'e':v(6.0),'txt':'ANSWERED ON THE FIRST RING'},
 {'t':v(13.05),'e':v(15.9),'txt':'YOUR RATES, QUOTED'},
 {'t':v(21.29),'e':v(23.5),'txt':'FLIGHT TRACKED'},
 {'t':v(58.63),'e':v(62.05),'txt':'BOOKED INTO YOUR CRM'},
 {'t':v(65.90),'e':round(CALL_END,3),'txt':'TEXT + EMAIL SENT'},
]
events={'pickup':round(st2vt(PICK),3),'booked':v(58.63),'ping':v(65.95),'callEnd':round(CALL_END,3),'total':round(TOTAL,3)}
cuts=[round(o,3) for o in vt0[1:]]
# clock: call seconds since pickup, per segment mapping
clock=[{'vt':round(o,3),'st':a} for (a,b),o in zip(SEG,vt0)]
# audio cut -> wav
src=os.environ.get('CALL_WAV',f'{HERE}/../../chauffeur/audio/samples/v1/{CALL}.m4a')
filt=[];labs=[]
for i,(a,b) in enumerate(SEG):
    filt.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={b-a-0.015}:d=0.015[s{i}]");labs.append(f"[s{i}]")
fc=';'.join(filt)+';'+''.join(labs)+f"concat=n={len(SEG)}:v=0:a=1[c]"
subprocess.run(['ffmpeg','-y','-v','error','-i',src,'-filter_complex',fc,'-map','[c]','-ar','48000','-ac','1','call_cut.wav'],check=True)
# rms per 1/60 s for waveform
w=wave.open('call_cut.wav');sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
hop=sr//60; rms=[float(np.sqrt((x[i:i+hop]**2).mean())) if len(x[i:i+hop]) else 0 for i in range(0,len(x),hop)]
m=max(rms); rms=[round(min(1,(r/m)**0.6),3) for r in rms]
json.dump({'fps':FPS,'segs':SEG,'vt0':vt0,'cuts':cuts,'caps':caps,'fields':F,'events':events,'callouts':callouts,'clock':clock,'pick':PICK,'rms':rms,'rmsRate':60},open('data.json','w'))
print('CALL_END',CALL_END,'TOTAL',TOTAL,'cuts',cuts,'events',events)
for c in caps: print(c['who'],c['s'],c['e'],' '.join(w['w'] for w in c['words']))
