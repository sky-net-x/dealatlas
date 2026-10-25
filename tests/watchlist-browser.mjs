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
  assert.equal(ready,true,'watchlist form loaded');
  const empty=await evalJs("document.querySelector('#watch-grid').innerText");
  assert.match(empty,/No saved watches/);
  await evalJs(`(()=>{
    document.querySelector('#watch-query').value='Lamy 2000';
    document.querySelector('#watch-category').value='Collectibles';
    document.querySelector('#watch-budget').value='180';
    document.querySelector('#watch-form').requestSubmit();
  })()`);
  let saved=false;
  for(let i=0;i<20;i++){
    await new Promise(r=>setTimeout(r,150));
    saved=await evalJs("document.querySelectorAll('.watch-card').length===1");
    if(saved)break;
  }
  assert.equal(saved,true,'watch created');
  const storage=await evalJs("localStorage.getItem('dealatlas.publicWatches.v1')");
  assert.match(storage,/Lamy 2000/);
  assert.match(await evalJs("document.querySelector('.watch-card').innerText"),/Not checked yet/);
  await evalJs("document.querySelector('.watch-explore-one').click()");
  const globalLinks=await evalJs("document.querySelectorAll('#global-market-grid .market-destination').length");
  assert.equal(globalLinks,5,'watch opens five international marketplaces');
  await evalJs("document.querySelector('.watch-check-one').click()");
  let matched=false;
  for(let i=0;i<60;i++){
    await new Promise(r=>setTimeout(r,250));
    matched=await evalJs("document.querySelectorAll('.watch-match-list a').length>0");
    if(matched)break;
  }
  assert.equal(matched,true,'budget match found at source');
  const results=await evalJs("document.querySelector('.watch-card').innerText");
  assert.match(results,/Lamy 2000 fountain pen/);
  assert.match(results,/150/);
  assert.match(results,/asking-price limit/);
  await send('Page.reload',{ignoreCache:true});
  let loaded=false;
  for(let i=0;i<25;i++){
    await new Promise(r=>setTimeout(r,150));
    loaded=await evalJs("document.querySelectorAll('.watch-card').length===1");
    if(loaded)break;
  }
  assert.equal(loaded,true,'watch survives reload');
  assert.match(await evalJs("document.querySelector('.watch-card').innerText"),/Not checked yet/);
  await evalJs("document.querySelector('.watch-remove').click()");
  const removed=await evalJs("({cards:document.querySelectorAll('.watch-card').length,watches:JSON.parse(localStorage.getItem('dealatlas.publicWatches.v1')).watches.length})");
  assert.equal(removed.cards,0);
  assert.equal(removed.watches,0);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  const mobile=await evalJs("({w:document.documentElement.scrollWidth,v:window.innerWidth,panels:document.querySelectorAll('.net-case').length})");
  assert.ok(mobile.w<=mobile.v,'no horizontal overflow on 390px mobile');
  assert.equal(mobile.panels,0);
  console.log('PASS: watch save, source budget check, persistence, delete, and mobile layout');
  console.log('WATCH MATCH:',JSON.stringify(results.slice(0,250)));
  console.log('MOBILE:',JSON.stringify(mobile));
}catch(error){
  console.error('BROWSER SMOKE FAILURE:',error.message);
  process.exitCode=1;
}finally{
  if(ws)ws.close();
  if(tab?.id)await fetch('http://127.0.0.1:9222/json/close/'+tab.id).catch(()=>{});
  await new Promise(r=>server.close(r));
}
