// Agrova V1: simple, deterministic demo calculations. No reservations or settlement.
export const seed = {
  lots: [
    { id: 'LOT-001', farmer: 'Asha Devi', crop: 'Tomatoes', quantityKg: 30, grade: 'A', safety: 'cleared' },
    { id: 'LOT-002', farmer: 'Ravi Kumar', crop: 'Tomatoes', quantityKg: 40, grade: 'B', safety: 'cleared' },
    { id: 'LOT-003', farmer: 'Meena Singh', crop: 'Tomatoes', quantityKg: 25, grade: 'A', safety: 'cleared' }
  ],
  buyers: [
    { id: 'ORD-001', name: 'FreshMart', crop: 'Tomatoes', grade: 'A', demandKg: 80, rateRupees: 25, role: 'original', availability: 'accepting' },
    { id: 'ORD-002', name: 'SauceWorks', crop: 'Tomatoes', grade: 'B', demandKg: 30, rateRupees: 16, role: 'recovery', availability: 'accepting' }
  ]
};

export function eligibleStock(lots, buyer) {
  if (!buyer) return 0;
  return roundKg(lots
    .filter(lot => lot.crop.toLowerCase() === String(buyer.crop).toLowerCase() &&
       lot.grade === buyer.grade && lot.safety === 'cleared')
    .reduce((sum, lot) => sum + Math.max(0, Number(lot.quantityKg) || 0), 0));
}
export function roundKg(qty) { return Math.round((Number(qty) + Number.EPSILON) * 100) / 100; }
export function originalOrder(buyers) { return buyers.find(b => b.role === 'original') ?? null; }
export function recoveryOptions(lots, buyers) {
  return buyers.filter(b => b.role === 'recovery').map(b => {
    const eligibleKg = eligibleStock(lots, b);
    const proposalKg = b.availability === 'accepting' ?
      roundKg(Math.min(eligibleKg, Math.max(0, Number(b.demandKg) || 0))) : 0;
    return { ...b, eligibleKg, proposalKg,
      estimatedGrossRupees: Math.round(proposalKg * (Number(b.rateRupees) || 0) * 100) / 100,
      available: proposalKg > 0 };
  }).sort((a, b) => b.estimatedGrossRupees - a.estimatedGrossRupees);
}
export function summary(state) {
  const lots = state.lots || [], buyers = state.buyers || [];
  const order = originalOrder(buyers);
  const totalKg = roundKg(lots.reduce((s, lot) => s + (Math.max(0, Number(lot.quantityKg)) || 0), 0));
  const eligibleKg = eligibleStock(lots, order);
  const shortageKg = order ? roundKg(Math.max(0, Number(order.demandKg) - eligibleKg)) : 0;
  const gradeMismatchKg = order ? roundKg(lots.filter(lot =>
    lot.crop.toLowerCase() === order.crop.toLowerCase() && lot.grade !== order.grade && lot.safety === 'cleared'
  ).reduce((s, lot) => s + Number(lot.quantityKg), 0)) : 0;
  const options = recoveryOptions(lots, buyers);
  return { order, totalKg, eligibleKg, shortageKg, gradeMismatchKg, options,
    heldKg: roundKg(lots.filter(l => l.safety !== 'cleared').reduce((s, l) => s + Number(l.quantityKg), 0)) };
}
