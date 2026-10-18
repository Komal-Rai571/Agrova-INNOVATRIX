import {randomBytes,createHash} from 'node:crypto';
import {one,run} from './db.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
const hits=new Map();
export function validEmail(value){
 const email=String(value||'').trim().toLowerCase();
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email))throw Object.assign(new Error('Enter a valid email address.'),{status:400});
 return email;
}
export function validPassword(pass){
 if(typeof pass!=='string'||pass.length<10||pass.length>128||!/[A-Z]/.test(pass)||!/[a-z]/.test(pass)||!/[0-9]/.test(pass))
  throw Object.assign(new Error('Use 10+ characters, uppercase, lowercase and a number.'),{status:400});
 return true;
}
export function authLimit(req,route){
 const ip=req.socket.remoteAddress||'unknown',key=ip+':'+route,now=Date.now();
 const recent=(hits.get(key)||[]).filter(time=>now-time<60000);
 if(recent.length>=8)throw Object.assign(new Error('Too many requests. Try again in one minute.'),{status:429});
 recent.push(now);hits.set(key,recent);
 if(hits.size>3000)for(const [k,arr] of hits)if(arr.every(t=>now-t>=60000))hits.delete(k);
}
export function issueToken(userId,purpose){
 const raw=randomBytes(32).toString('hex');const current=new Date().toISOString();
 run('DELETE FROM auth_tokens WHERE user_id=? AND purpose=?',userId,purpose);
 run('INSERT INTO auth_tokens VALUES(?,?,?,?,?,?)',digest(raw),userId,purpose,Date.now()+(purpose==='verify'?24*60*60*1000:30*60*1000),null,current);
 return raw;
}
export function redeemToken(raw,purpose){
 if(!/^[0-9a-f]{64}$/.test(raw))throw Object.assign(new Error('Invalid or expired link.'),{status:400});
 const token=one('SELECT * FROM auth_tokens WHERE token_hash=? AND purpose=? AND used_at IS NULL AND expires_at>?',digest(raw),purpose,Date.now());
 if(!token)throw Object.assign(new Error('Invalid or expired link.'),{status:400});
 run('UPDATE auth_tokens SET used_at=? WHERE token_hash=?',new Date().toISOString(),digest(raw));
 return token.user_id;
}
export async function sendAccountEmail({kind,email,token,req}){
 const configured=process.env.RESEND_API_KEY&&process.env.MAIL_FROM;
 const local=process.env.NODE_ENV!=='production';
 const base=process.env.PUBLIC_BASE_URL?.replace(/\/$/,'')||(local?`http://localhost:${Number(process.env.PORT||3000)}`:null);
 if(!base)throw Error('PUBLIC_BASE_URL is required for outgoing emails.');
 if(!/^https?:\/\//.test(base)||(process.env.NODE_ENV==='production'&&!base.startsWith('https://')))throw Error('Use a valid HTTPS PUBLIC_BASE_URL.');
 const suffix=kind==='verify'?'verify':'reset';
 const url=`${base}/?auth=${suffix}&token=${encodeURIComponent(token)}`;
 if(!configured){
  if(!local)throw Error('Email is not configured for production.');
  console.log(`\n[AGROVA DEVELOPMENT ONLY - NOT AN EMAIL SENT]\n${kind.toUpperCase()} link for ${email}:\n${url}\n`);
  return {mode:'development'};
 }
 const title=kind==='verify'?'Verify your Agrova FPO account':'Reset your Agrova password';
 const content=kind==='verify'?'Verify your email to activate your FPO workspace. This link expires in 24 hours.':'Reset your password. This link expires in 30 minutes.';
 const safe=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const response=await fetch('https://api.resend.com/emails',{
  method:'POST',headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({from:process.env.MAIL_FROM,to:[email],subject:title,html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h2 style="color:#235039">Agrova</h2><p>${content}</p><p><a style="display:inline-block;padding:12px 18px;background:#235039;color:white;border-radius:8px;text-decoration:none" href="${safe(url)}">${kind==='verify'?'Verify my email':'Reset my password'}</a></p><p>If you did not request this, ignore this email.</p></div>`})
 });
 if(!response.ok)throw Error(`Resend refused message (${response.status}): ${(await response.text()).slice(0,150)}`);
 return {mode:'sent'};
}
