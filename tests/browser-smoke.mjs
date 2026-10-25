// Browser smoke test on the already-running Chromium CDP endpoint.
// Launches a temporary tab (no new Chrome profile); closes it on exit.
// No external packages or credentials are required.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file===root)file=resolve(root,'index.html');
  if(!file.startsWith(root+sep) && file!==root){res.writeHead(403);res.end();return;}
  try { const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(bytes); }
  catch {res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/';
let tab;
let ws;
let pending=new Map(), msgId=0;
try{
  const response=await fetch('http://127.0.0.1:9222/json/new?'+encodeURIComponent(url),{method:'PUT'});
  if(!response.ok)throw new Error('CDP new tab HTTP '+response.status);
  tab=await response.json();
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolveOpen,reject)=>{
    ws.addEventListener('open',resolveOpen,{once:true});
    ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message',event=>{
    const reply=JSON.parse(event.data);
    if(reply.id&&pending.has(reply.id)){
      const p=pending.get(reply.id);pending.delete(reply.id);
      reply.error?p.reject(new Error(reply.error.message)):p.resolve(reply.result);
    }
  });
  const send=(method,params={})=>new Promise((resolveSend,reject)=>{
    const id=++msgId;pending.set(id,{resolve:resolveSend,reject});
    ws.send(JSON.stringify({id,method,params}));
  });
  const evalJs=async expression=>{
    const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate',{url});
  let ready=false;
  for(let t=0;t<30;t++){
    await new Promise(r=>setTimeout(r,300));
    ready=await evalJs("!!document.querySelector('#deal-form') && !!document.querySelector('#deal-fee-rate')");
    if(ready)break;
  }
  assert.equal(ready,true,'calculator form loaded');
  let marketLoaded=false;
  for(let t=0;t<55;t++){
    await new Promise(r=>setTimeout(r,300));
    marketLoaded=await evalJs("document.querySelectorAll('.source-signal-card').length === 6");
    if(marketLoaded)break;
  }
  assert.equal(marketLoaded,true,'six current official Discogs asking-price signals displayed');
  const disclaimers=await evalJs("({links:document.querySelectorAll('.source-signal-card a').length,disclaimer:document.querySelector('.source-disclaimer').textContent})");
  assert.equal(disclaimers.links,6);
  assert.match(disclaimers.disclaimer,/not affiliated with, sponsored or endorsed by Discogs/);
  await evalJs(`(()=>{
    const set=(id,value)=>document.getElementById(id).value=value;
    set('deal-query','Smoke-test camera');
    set('deal-price','950');
    set('deal-currency','USD');
    set('deal-shipping','50');
    set('deal-costs','30');
    set('deal-fee-rate','12');
    set('deal-fixed-fee','0');
    set('deal-reserve','0');
    set('deal-fx-buffer','2');
    set('sold-comps','900 USD\\n1000 USD\\n1200 USD\\n1300 USD\\n1400 USD');
    document.getElementById('deal-form').requestSubmit();
  })()`);
  const result=await evalJs("document.getElementById('deal-result').innerText");
  assert.match(result,/At sample median/);
  assert.match(result,/At sample lower quartile/);
  assert.match(result,/\+\$7\.00/);
  assert.match(result,/-\$169\.00/);
  assert.match(result,/unverified, user-entered sold prices/);
  await evalJs(`(()=>{
    document.getElementById('sold-comps').value='';
    document.getElementById('deal-target').value='1200';
    document.getElementById('deal-form').requestSubmit();
  })()`);
  const manual=await evalJs("document.getElementById('deal-result').innerText");
  assert.match(manual,/At assumed resale value/);
  assert.match(manual,/Not available/);
  assert.match(manual,/No independent sale evidence/);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  const mobile=await evalJs("({w:document.documentElement.scrollWidth,v:window.innerWidth,panels:document.querySelectorAll('.net-case').length})");
  assert.ok(mobile.w<=mobile.v,'no horizontal overflow on 390px mobile');
  assert.equal(mobile.panels,2);
  console.log('PASS: median +$7.00, cautious -$169.00, manual benchmark warning, no mobile overflow');
  console.log('MOBILE:',JSON.stringify(mobile));
  console.log('CHECK:',JSON.stringify(result.slice(0,350)));
}catch(error){
  console.error('BROWSER SMOKE FAILURE:',error.message);
  process.exitCode=1;
}finally{
  if(ws)ws.close();
  if(tab?.id)await fetch('http://127.0.0.1:9222/json/close/'+tab.id).catch(()=>{});
  await new Promise(r=>server.close(r));
}
