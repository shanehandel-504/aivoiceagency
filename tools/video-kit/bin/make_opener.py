# VIDEO KIT OPENER - the short hit on the cut from the cover to the call, the moment the phone is answered.
# Same synthesis style as make_boom.py, smaller and higher: a pitch-dropping sine 220 -> 90 Hz + 2nd/3rd
# harmonics (so phone speakers hear it), soft-clipped with tanh(3.5). No noise thump.
# Deterministic: same file every run. 48 kHz mono, 0.4 s. Mixed under the boom (volume 0.7 before the
# -14 LUFS master); the boom on the BOOKED slam stays the signature.
import numpy as np, wave, sys
out = sys.argv[1] if len(sys.argv) > 1 else 'opener.wav'
sr=48000; L=0.4; t=np.arange(int(sr*L))/sr
f=90+(220-90)*np.exp(-t/0.03); ph=2*np.pi*np.cumsum(f)/sr
att=(1-np.exp(-t/0.002))
body=np.sin(ph)*np.exp(-t/0.11)*att
h2=0.55*np.sin(2*ph)*np.exp(-t/0.062)*att
h3=0.25*np.sin(3*ph+0.4)*np.exp(-t/0.04)*att
x=np.tanh(3.5*(body+h2+h3))/np.tanh(3.5)
x*=0.89/np.abs(x).max(); x[-int(0.03*sr):]*=np.linspace(1,0,int(0.03*sr))
w=wave.open(out,'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
print('wrote', out)
