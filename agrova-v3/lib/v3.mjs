import {finiteKg,roundKg,canUseLot} from './domain.mjs';
const active=s=>['reserved','delivered','dispatched'].includes(s);
export const sum=(items,key='quantity_kg')=>roundKg(items.reduce((v,x)=>v+Number(x[key]||0),0));
export function freeQuantity(lot,recovery=[],original=[]){const committed=sum([...recovery.filter(x=>active(x.status)&&x.lot_id===lot.id),...original.filter(x=>active(x.status)&&x.lot_id===lot.id)]);return roundKg(Math.max(0,lot.quantity_kg-committed));}
export function orderCoverage(order,lots,recovery=[],original=[]){
 const committed=sum([...recovery.filter(x=>active(x.status)&&x.order_id===order.id),...original.filter(x=>active(x.status)&&x.order_id===order.id)]);
 const eligible=sum(lots.filter(l=>canUseLot(l,order)).map(l=>({quantity_kg:freeQuantity(l,recovery,original)})));
 return {committed_kg:committed,free_eligible_kg:eligible,uncovered_kg:roundKg(Math.max(0,order.quantity_kg-committed-eligible)),unallocated_to_order_kg:roundKg(Math.max(0,order.quantity_kg-committed)),ready_kg:roundKg(Math.min(order.quantity_kg,committed+eligible))};
}
export function netRecovery(quantityKg,pricePaise,transportPaise=0,handlingPaise=0){const qty=finiteKg(quantityKg);const gross=Math.round(qty*pricePaise);const cost=Number(transportPaise)+Number(handlingPaise);return {gross_paise:gross,transport_paise:transportPaise,handling_paise:handlingPaise,net_paise:gross-cost,net_per_kg_paise:Math.round((gross-cost)/qty)};}
export function qualityCheck({grade,crop,safety},order){return canUseLot({grade,crop,safety},order);}
