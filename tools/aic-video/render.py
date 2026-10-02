import asyncio, json, sys, os
from playwright.async_api import async_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
async def main(mode, times=None):
    D=json.load(open(f'{HERE}/data.json'))
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1080,'height':1920},device_scale_factor=1)
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('file://'+HERE+'/overlay.html'); await pg.evaluate('document.fonts.ready')
        await pg.evaluate('d=>setData(d)', D)
        if mode=='test':
            os.makedirs(f'{HERE}/test',exist_ok=True)
            for t in times:
                await pg.evaluate('t=>render(t)', t); await pg.screenshot(path=f'{HERE}/test/o_{t:06.2f}.png',omit_background=True)
        else:
            os.makedirs(f'{HERE}/frames_v2',exist_ok=True)
            n=int(round(D['events']['total']*30))
            for i in range(n):
                await pg.evaluate('t=>render(t)', (i+0.5)/30)
                await pg.screenshot(path=f'{HERE}/frames_v2/f{i:05d}.png',omit_background=True)
            print('frames',n)
        print('errors',errs[:5])
        await b.close()
if __name__=='__main__':
    m=sys.argv[1]; ts=[float(x) for x in sys.argv[2:]]
    asyncio.run(main(m,ts))
