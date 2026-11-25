const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let playwright;
try{playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');}
catch{playwright=require(path.join(process.env.TEMP,'recursive-soundscapes-verification/node_modules/playwright'));}
const {chromium}=playwright;
(async()=>{
 const root=path.resolve('.');const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data);});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:'+server.address().port);
 console.log('Loaded',await page.title());assert.equal(await page.locator('[data-algorithm]').count(),5);assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.locator('[data-algorithm="koch"]').click();await page.locator('#kochMode').selectOption('curve');
 await page.locator('#depth').fill('5');await page.locator('#depth').dispatchEvent('change');
 assert.equal(await page.locator('#nodeCount').textContent(),'1,024');
 await page.locator('#playButton').click();await page.waitForTimeout(550);assert.equal(await page.locator('#playButton').getAttribute('aria-label'),'Pause');
 await page.locator('#playButton').click();const paused=await page.locator('#elapsed').textContent();await page.waitForTimeout(200);assert.equal(await page.locator('#elapsed').textContent(),paused);
 await page.locator('#playButton').click();await page.locator('#timeline').fill('650');await page.locator('#timeline').dispatchEvent('input');await page.waitForTimeout(150);
 await page.screenshot({path:'tests/koch-desktop.png'});
 await page.locator('#stopButton').click();assert.equal(await page.locator('#timeline').inputValue(),'0');
 await page.locator('#kochMode').selectOption('snowflake');assert.equal(await page.locator('#nodeCount').textContent(),'3,072');
 await page.locator('[data-algorithm="hanoi"]').click();assert(await page.locator('#hanoiControls').isVisible());assert(!(await page.locator('#depth').isVisible()));
 await page.locator('#disks').fill('8');await page.locator('#disks').dispatchEvent('change');assert.equal(await page.locator('#nodeCount').textContent(),'255');
 await page.locator('#playButton').click();await page.locator('#timeline').fill('500');await page.locator('#timeline').dispatchEvent('input');await page.waitForTimeout(160);
 assert((await page.locator('#algorithmProgress').textContent()).includes('Move 13'));
 await page.screenshot({path:'tests/hanoi-desktop.png'});
 await page.locator('#playButton').click();await page.locator('#timeline').fill('995');await page.locator('#timeline').dispatchEvent('input');await page.waitForTimeout(80);
 assert((await page.locator('#algorithmProgress').textContent()).includes('Complete'));
 await page.locator('#stopButton').click();assert((await page.locator('#algorithmProgress').textContent()).includes('Move 0 / 255'));
 for(const algorithm of ['fibonacci','sierpinski','tree','koch','hanoi']){
  await page.locator('[data-algorithm="'+algorithm+'"]').click();await page.locator('#playButton').click();await page.waitForTimeout(60);
  await page.locator('#generateButton').click();assert.equal(await page.locator('#playButton').getAttribute('aria-label'),'Play');
 }
 // Verify loop restarts and the UI follows the asynchronous audio restart.
 await page.locator('[data-algorithm="hanoi"]').click();await page.locator('#disks').fill('1');await page.locator('#disks').dispatchEvent('change');
 await page.locator('#loopButton').click();await page.locator('#playButton').click();await page.locator('#timeline').fill('999');await page.locator('#timeline').dispatchEvent('input');await page.waitForTimeout(450);
 assert.equal(await page.locator('#playButton').getAttribute('aria-label'),'Pause');assert(Number(await page.locator('#timeline').inputValue())<300);
 await page.locator('#stopButton').click();await page.locator('#loopButton').click();
 // Actual export button, including snapshot and download handling.
 const downloaded=page.waitForEvent('download');await page.locator('#exportButton').click();const download=await downloaded;
 assert(download.suggestedFilename().endsWith('.wav'));assert((await fs.promises.readFile(await download.path())).subarray(0,4).toString()==='RIFF');
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#reducedMotion').check();await page.locator('#playButton').click();await page.waitForTimeout(200);await page.screenshot({path:'tests/hanoi-mobile.png',fullPage:true});await page.locator('#stopButton').click();
 await page.locator('[data-algorithm="koch"]').click();await page.screenshot({path:'tests/koch-mobile.png',fullPage:true});
 // Render short real WAVs in every mood using the same offline graph as live playback.
 const wavs=await page.evaluate(async()=>{
  const out=[];for(const algorithm of ['koch','hanoi'])for(const mood of Object.keys(RS.moods))for(const instrument of ['soft','bell','pad','pluck']){
   const settings={...RS.defaults,algorithm,mood,instrument,depth:1,disks:1,tempo:160,density:1};
   const music=RS.makeComposition(RS.generateScene(settings),settings),blob=await RS.exportWav(music,settings),bytes=await blob.arrayBuffer();
   const view=new DataView(bytes);let peak=0,sum=0;for(let i=44;i<bytes.byteLength;i+=2){const n=view.getInt16(i,true)/32768;peak=Math.max(peak,Math.abs(n));sum+=n*n;}
   out.push({algorithm,mood,instrument,header:String.fromCharCode(...new Uint8Array(bytes,0,4)),channels:view.getUint16(22,true),rate:view.getUint32(24,true),peak,rms:Math.sqrt(sum/((bytes.byteLength-44)/2))});
  }return out;
 });for(const wav of wavs){assert.equal(wav.header,'RIFF');assert.equal(wav.channels,2);assert.equal(wav.rate,44100);assert(wav.peak>0&&wav.peak<1);}
 console.log('WAV results:',wavs.length,'renders; peak range',Math.min(...wavs.map(w=>w.peak)),Math.max(...wavs.map(w=>w.peak)));assert.deepEqual(errors,[]);
 const edge=await page.evaluate(async()=>{
  const s={...RS.defaults,algorithm:'hanoi',disks:1,tempo:160,density:1,volume:0};
  const composition=RS.makeComposition(RS.generateScene(s),s);
  const blob=await RS.exportWav(composition,s),v=new DataView(await blob.arrayBuffer());let peak=0;
  for(let i=44;i<v.byteLength;i+=2)peak=Math.max(peak,Math.abs(v.getInt16(i,true)));
  const engine=new RS.AudioEngine();engine.load(composition,s);
  let release;engine.initialize=()=>new Promise(resolve=>{release=resolve;});
  const playing=engine.play();engine.stop();release();await playing;
  return {silentPeak:peak,stalePlaying:engine.playing};
 });assert.equal(edge.silentPeak,0);assert.equal(edge.stalePlaying,false);
 await browser.close();await new Promise(r=>server.close(r));console.log('PASS: Five-algorithm browser controls, pause/resume/seek/reset, completion, mobile overflow, reduced motion, and 32 real WAV exports.');
})().catch(e=>{console.error(e);process.exit(1)});
