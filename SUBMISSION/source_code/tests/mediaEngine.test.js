import { recommendMedia } from '../src/lib/engines/mediaEngine';
import { PhysicalDistanceViolationError, NetworkValidationError } from '../src/lib/errors/NetworkErrors';

describe('Physical Media Decision Engine', () => {
  test('recommends Cat6a Copper for exactly 100m', () => {
    const res = recommendMedia(100);
    expect(res.mediaType).toContain('Category 6A');
    expect(res.transceiver).toContain('10GBASE-T');
    expect(res.distanceMeters).toBe(100);
  });

  test('recommends OM4 Multimode Fiber for 101m', () => {
    const res = recommendMedia(101);
    expect(res.mediaType).toContain('OM4');
    expect(res.transceiver).toContain('10GBASE-SR');
    expect(res.wavelength).toBe('850 nm (VCSEL Laser)');
  });

  test('recommends OM4 Multimode Fiber for exactly 400m', () => {
    const res = recommendMedia(400);
    expect(res.mediaType).toContain('OM4');
    expect(res.transceiver).toContain('10GBASE-SR');
    expect(res.opticalBudget).toBeDefined();
    expect(res.opticalBudget.totalPowerBudgetDb).toBe(2.6);
  });

  test('recommends OS2 Single-Mode Fiber for 401m', () => {
    const res = recommendMedia(401);
    expect(res.mediaType).toContain('OS2 Single-Mode');
    expect(res.transceiver).toContain('10GBASE-LR');
  });

  test('recommends 10GBASE-ER for 25km (Metro MAN)', () => {
    const res = recommendMedia(25000);
    expect(res.mediaType).toContain('OS2 Single-Mode');
    expect(res.transceiver).toContain('10GBASE-ER');
    expect(res.wavelength).toContain('1550 nm');
    expect(res.opticalBudget.totalBudgetDb).toBe(11.1);
    expect(res.opticalBudget.calculatedMarginDb).toBeGreaterThan(0);
    expect(res.opticalBudget.isFeasible).toBe(true);
  });

  test('calculates exact dynamic optical power budget and margin for 28km link', () => {
    const res = recommendMedia(28000);
    const b = res.opticalBudget;
    expect(b.distanceKm).toBe(28);
    expect(b.txPowerMinDbm).toBe(-4.7);
    expect(b.rxSensitivityDbm).toBe(-15.8);
    expect(b.totalBudgetDb).toBe(11.1);
    expect(b.fiberAttenuationDbPerKm).toBe(0.25);
    expect(b.fiberLossDb).toBe(7.0);
    expect(b.totalChannelLossDb).toBe(9.0);
    expect(b.calculatedMarginDb).toBe(2.1);
    expect(b.isFeasible).toBe(true);
  });

  test('recommends 10GBASE-ZR for >40km', () => {
    const res = recommendMedia(50000);
    expect(res.mediaType).toContain('OS2 Single-Mode');
    expect(res.transceiver).toContain('10GBASE-ZR');
  });

  test('throws PhysicalDistanceViolationError when copper is explicitly requested for > 100m', () => {
    expect(() => {
      recommendMedia(150, { requestedMedium: 'Copper' });
    }).toThrow(PhysicalDistanceViolationError);
  });

  test('throws NetworkValidationError for negative distance', () => {
    expect(() => {
      recommendMedia(-10);
    }).toThrow(NetworkValidationError);
  });

  test('throws NetworkValidationError for non-numeric/invalid distance', () => {
    expect(() => {
      recommendMedia('invalid-meters');
    }).toThrow(NetworkValidationError);
  });
});

