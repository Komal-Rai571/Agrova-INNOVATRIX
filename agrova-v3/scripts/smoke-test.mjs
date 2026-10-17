// Run with the local server started: npm start, then npm run smoke.
// Resets illustrative demo records intentionally.
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
let cookie='';
async function api(path,method='GET',body){
 const r=await fetch(`${base}/api${path}`,{method,headers:{...(cookie?{'Cookie':cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const json=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(`${method} ${path}: ${r.status}: ${json.error}`);
 return {json,response:r};
}
const expect=(cond,msg)=>{if(!cond)throw Error(msg)};
try{
 let {response}=await api('/auth/login','POST',{username:'manager@agrova.test',password:'Agrova123!'});
 cookie=response.headers.get('set-cookie')?.split(';')[0];expect(cookie,'No auth cookie');
 await api('/demo/reset','POST',{});
 let b=(await api('/bootstrap')).json;
 expect(b.lots.length===3&&b.suppliers.length===2,'seed mismatch');
 let a=(await api('/original/auto-allocate','POST',{order_id:'ORD-001'})).json;
 expect(a.remaining_to_allocate_kg===25,'initial 25kg shortage should remain');
 for(const source of b.suppliers){
  await api(`/sourcing/${source.id}/confirm`,'POST',{});
  await api(`/sourcing/${source.id}/receive`,'POST',{received_kg:source.offered_kg,grade:'A',safety:'cleared'});
 }
 a=(await api('/original/auto-allocate','POST',{order_id:'ORD-001'})).json;
 expect(a.remaining_to_allocate_kg===0,'25kg source should cover remaining original allocation');
 b=(await api('/bootstrap')).json;
 expect(b.original_allocations.filter(x=>x.status==='reserved').reduce((t,x)=>t+x.quantity_kg,0)===80,'80kg not reserved');
 const comparison=(await api('/recovery/comparison?lot_id=LOT-002')).json;
 expect(comparison.offers.some(x=>x.buyer_name==='SauceWorks'&&x.max_kg===30),'missing Grade B buyer recommendation');
 const offer=(await api('/offers','POST',{case_id:'CASE-001',order_id:'ORD-002',quantity_kg:30})).json.id;
 await api(`/offers/${offer}/demo-accept`,'POST',{});
 await api(`/offers/${offer}/reserve`,'POST',{});
 const delivery=(await api('/deliveries','POST',{offer_id:offer,delivered_kg:30,accepted_kg:28,rejected_kg:2})).json.id;
 for(const [kind,accepted] of [['inspection',28],['buyer',25]]){
  const e=(await api('/evidence','POST',{delivery_id:delivery,kind,file_name:`${kind}.txt`,mime:'text/plain',base64:Buffer.from(`Lot: LOT-002\nDelivered: 30\nAccepted: ${accepted}\nRate: 16\n`).toString('base64')})).json.id;
  await api(`/evidence/${e}/extract`,'POST',{});
  await api(`/evidence/${e}/verify`,'POST',{accepted_kg:accepted,delivered_kg:30,rate_inr:16,deductions_inr:0});
 }
 b=(await api('/bootstrap')).json;
 expect(b.deliveries[0].reconciliation.disputed_paise===4800,'₹48 discrepancy failed');
 console.log('PASS: sourcing 15+10, 80kg original allocation, recovery 30kg, receipt mismatch ₹48.');
 console.log('CAUTION: This test RESET the illustrative demo workspace.');
}catch(err){console.error('SMOKE FAILED:',err.message);process.exitCode=1;}
