import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const original=process.cwd(),dir=mkdtempSync(join(tmpdir(),'agrova-auth-test-'));
process.chdir(dir);
const {validEmail,validPassword,issueToken,redeemToken}=await import('../lib/auth.mjs');
const {run,one,withWorkspace,workspaceFor}=await import('../lib/db.mjs');
test('email normalization and password security checks',()=>{
 assert.equal(validEmail('  FPO@Example.COM  '),'fpo@example.com');
 assert.throws(()=>validEmail('not-an-email'),/valid email/);
 assert.equal(validPassword('StrongPass123'),true);
 assert.throws(()=>validPassword('weak'),/10\+ characters/);
 assert.throws(()=>validPassword('lowercaseonly123'),/uppercase/);
});
test('verification link is single-use and cannot be used as reset',()=>{
 run('INSERT INTO users(id,username,password_hash,display_name,role,buyer_id,fpo_id) VALUES(?,?,?,?,?,?,?)','USR-T1','test@example.test','not-for-login','Test','manager',null,'test-fpo');
 const token=issueToken('USR-T1','verify');
 assert.match(token,/^[0-9a-f]{64}$/);
 assert.throws(()=>redeemToken(token,'reset'),/Invalid or expired/);
 assert.equal(redeemToken(token,'verify'),'USR-T1');
 assert.throws(()=>redeemToken(token,'verify'),/Invalid or expired/);
});
test('separate FPO workspaces cannot query one another’s farmers',()=>{
 const a=workspaceFor('11111111-1111-4111-8111-111111111111');
 const b=workspaceFor('22222222-2222-4222-8222-222222222222');
 withWorkspace(a,()=>run('INSERT INTO farmers VALUES(?,?,?,?)','FARM-001','Private Farmer A',null,new Date().toISOString()));
 assert.equal(withWorkspace(a,()=>one('SELECT name FROM farmers WHERE id=?','FARM-001').name),'Private Farmer A');
 assert.equal(withWorkspace(b,()=>one('SELECT name FROM farmers WHERE id=?','FARM-001')),undefined);
});
test('new workspace starts without any seeded demo lots or buyers',()=>{
 const w=workspaceFor('33333333-3333-4333-8333-333333333333');
 assert.equal(withWorkspace(w,()=>one('SELECT COUNT(*) as n FROM lots').n),0);
 assert.equal(withWorkspace(w,()=>one('SELECT COUNT(*) as n FROM orders').n),0);
});
