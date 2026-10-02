# AIC SIGNATURE BOOM — the end-card bass hit (video 01, Oct 2 2026). Shane: "shook my truck".
# Deterministic: same file every run. 48 kHz mono, 1.8 s. Placed at the BOOKED slam, mixed at volume 0.9
# before the -14 LUFS master. Pitch-dropping sine 160 -> 55 Hz + 2nd/3rd harmonics (so phone speakers hear it)
# + a 25 ms low-passed noise thump, soft-clipped with tanh(3.5).
import numpy as np, wave, sys
out = sys.argv[1] if len(sys.argv) > 1 else 'boom.wav'
sr=48000; L=1.8; t=np.arange(int(sr*L))/sr
f=55+(160-55)*np.exp(-t/0.05); ph=2*np.pi*np.cumsum(f)/sr
att=(1-np.exp(-t/0.003))
body=np.sin(ph)*np.exp(-t/0.5)*att
h2=0.55*np.sin(2*ph)*np.exp(-t/0.28)*att
h3=0.25*np.sin(3*ph+0.4)*np.exp(-t/0.18)*att
n=np.random.default_rng(7).standard_normal(len(t))
a=np.exp(-2*np.pi*2500/sr); y=np.zeros_like(n)
for i in range(1,len(n)): y[i]=(1-a)*n[i]+a*y[i-1]
thump=y/np.abs(y).max()*np.exp(-t/0.025)*0.7
x=np.tanh(3.5*(body+h2+h3+thump))/np.tanh(3.5)
x*=0.89/np.abs(x).max(); x[-int(0.08*sr):]*=np.linspace(1,0,int(0.08*sr))
w=wave.open(out,'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
print('wrote', out)
