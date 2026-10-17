import test from 'node:test';
import assert from 'node:assert/strict';
import {freeQuantity,orderCoverage,netRecovery,qualityCheck} from '../lib/v3.mjs';
const lots=[
 {id:'LOT-001',crop:'Tomatoes',grade:'A',safety:'cleared',quantity_kg:30},
 {id:'LOT-002',crop:'Tomatoes',grade:'B',safety:'cleared',quantity_kg:40},
 {id:'LOT-003',crop:'Tomatoes',grade:'A',safety:'cleared',quantity_kg:25}
];
const fresh={id:'ORD-001',crop:'Tomatoes',grade:'A',quantity_kg:80};
test('V3 original order starts with 25kg uncovered despite 95kg total',()=>{
 const c=orderCoverage(fresh,lots);assert.equal(c.uncovered_kg,25);assert.equal(c.ready_kg,55);
});
test('partner quote or confirmation does not count until an inspected lot exists',()=>{
 const c=orderCoverage(fresh,lots);assert.equal(c.uncovered_kg,25);
});
test('quality failed or safety held inbound lot cannot cover Grade A order',()=>{
 assert.equal(qualityCheck({crop:'Tomatoes',grade:'B',safety:'cleared'},fresh),false);
 assert.equal(qualityCheck({crop:'Tomatoes',grade:'A',safety:'hold'},fresh),false);
});
test('received and inspected Grade A 15kg + 10kg covers 25kg shortage',()=>{
 const extended=[...lots,{id:'LOT-004',crop:'Tomatoes',grade:'A',safety:'cleared',quantity_kg:15},{id:'LOT-005',crop:'Tomatoes',grade:'A',safety:'cleared',quantity_kg:10}];
 const c=orderCoverage(fresh,extended);assert.equal(c.uncovered_kg,0);assert.equal(c.ready_kg,80);
});
test('allocated original stock cannot be offered to recovery buyer',()=>{
 const allocation=[{lot_id:'LOT-001',order_id:'ORD-001',quantity_kg:30,status:'reserved'}];
 assert.equal(freeQuantity(lots[0],[],allocation),0);
});
test('dispatched original order remains locked and cannot be resold',()=>{
 const allocation=[{lot_id:'LOT-001',order_id:'ORD-001',quantity_kg:30,status:'dispatched'}];
 assert.equal(freeQuantity(lots[0],[],allocation),0);
});
test('mixed reservations cap available stock without negative inventory',()=>{
 const recovery=[{lot_id:'LOT-002',order_id:'ORD-002',quantity_kg:30,status:'reserved'}];
 assert.equal(freeQuantity(lots[1],recovery,[]),10);
});
test('estimated net beats headline price after transport and handling',()=>{
 const a=netRecovery(30,2000,20000,0);const b=netRecovery(30,1800,4000,0);
 assert.equal(a.net_paise,40000);assert.equal(b.net_paise,50000);
 assert.ok(b.net_paise>a.net_paise);
});
test('negative estimated net is valid and should not be presented as profit',()=>{
 const n=netRecovery(5,100,1000,0);assert.equal(n.net_paise,-500);
});
