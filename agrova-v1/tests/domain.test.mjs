import test from 'node:test';
import assert from 'node:assert/strict';
import { seed, eligibleStock, summary, recoveryOptions } from '../public/domain.mjs';
const clone = () => structuredClone(seed);
test('original baseline is 95 kg with 55 eligible and 25 kg shortage', () => {
  const s = summary(clone());
  assert.equal(s.totalKg,95);
  assert.equal(s.eligibleKg,55);
  assert.equal(s.shortageKg,25);
  assert.equal(s.gradeMismatchKg,40);
});
test('Grade B is not eligible for Grade A FreshMart', () => {
  assert.equal(eligibleStock(seed.lots,seed.buyers[0]),55);
});
test('SauceWorks recovery proposal capped by demand at 30 kg, gross 480', () => {
  const r = recoveryOptions(seed.lots,seed.buyers)[0];
  assert.equal(r.proposalKg,30);
  assert.equal(r.estimatedGrossRupees,480);
});
test('changing SauceWorks demand to 15 changes proposed quantity', () => {
  const s=clone();s.buyers[1].demandKg=15;
  assert.equal(summary(s).options[0].proposalKg,15);
});
test('safety hold excludes inventory from matching', () => {
  const s=clone();s.lots[1].safety='hold';
  assert.equal(summary(s).options[0].proposalKg,0);
  assert.equal(summary(s).heldKg,40);
});
test('unavailable recovery buyer cannot be proposed', () => {
  const s=clone();s.buyers[1].availability='paused';
  assert.equal(summary(s).options[0].proposalKg,0);
});
test('increasing Grade A supply reduces original shortage', () => {
  const s=clone();s.lots[0].quantityKg=40;
  assert.equal(summary(s).shortageKg,15);
});
test('eligible match is crop-specific, not just grade', () => {
  const s=clone();s.lots[0].crop='Onions';
  assert.equal(summary(s).eligibleKg,25);
});
