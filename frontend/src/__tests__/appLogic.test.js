/**
 * appLogic.test.js
 *
 * Real, executing tests for the pure scoring/state logic that the live app
 * runs (App.jsx imports these from ../utils/appLogic.js). Uses fast-check
 * for property-based coverage, matching the style already used in
 * backend/__tests__/advisor.test.js.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  deriveState,
  getPollutionLevel,
  applyActionDelta,
  computeQuizScore,
  STATE_THRESHOLDS,
} from '../utils/appLogic.js';

describe('deriveState — boundary example tests', () => {
  it('returns Polluted at and below the lower threshold', () => {
    expect(deriveState(0)).toBe('Polluted');
    expect(deriveState(STATE_THRESHOLDS.POLLUTED_MAX)).toBe('Polluted');
  });

  it('returns Neutral in the middle band', () => {
    expect(deriveState(STATE_THRESHOLDS.POLLUTED_MAX + 1)).toBe('Neutral');
    expect(deriveState(75)).toBe('Neutral');
  });

  it('returns Green at and above the upper threshold', () => {
    expect(deriveState(STATE_THRESHOLDS.GREEN_MIN)).toBe('Green');
    expect(deriveState(100)).toBe('Green');
  });
});

describe('deriveState — property: always one of three known states', () => {
  it('never returns anything outside Polluted/Neutral/Green for any 0-100 score', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        expect(['Polluted', 'Neutral', 'Green']).toContain(deriveState(score));
      }),
      { numRuns: 100 },
    );
  });
});

describe('getPollutionLevel — property: inverse relationship, always 0-1', () => {
  it('is always within [0, 1] and decreases as score increases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (a, b) => {
          const levelA = getPollutionLevel(a);
          const levelB = getPollutionLevel(b);
          expect(levelA).toBeGreaterThanOrEqual(0);
          expect(levelA).toBeLessThanOrEqual(1);
          if (a < b) expect(levelA).toBeGreaterThanOrEqual(levelB);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('is 1 at score 0 and 0 at score 100', () => {
    expect(getPollutionLevel(0)).toBe(1);
    expect(getPollutionLevel(100)).toBe(0);
  });
});

describe('applyActionDelta — property: stays within documented bounds', () => {
  it('never exceeds 100 when adding, and never drops below 10 when removing', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 50 }),
        fc.boolean(),
        (score, points, isAdding) => {
          const result = applyActionDelta(score, points, isAdding);
          expect(result).toBeLessThanOrEqual(100);
          if (!isAdding) expect(result).toBeGreaterThanOrEqual(10);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('adding points increases the score up to a cap of 100', () => {
    expect(applyActionDelta(95, 20, true)).toBe(100);
    expect(applyActionDelta(50, 10, true)).toBe(60);
  });

  it('removing points decreases the score down to a floor of 10', () => {
    expect(applyActionDelta(15, 20, false)).toBe(10);
    expect(applyActionDelta(50, 10, false)).toBe(40);
  });
});

describe('computeQuizScore — property: sum of the five answer values', () => {
  it('matches manual addition for any combination of answer points', () => {
    fc.assert(
      fc.property(
        fc.record({
          transport: fc.integer({ min: 5, max: 20 }),
          ac: fc.integer({ min: 5, max: 20 }),
          diet: fc.integer({ min: 5, max: 20 }),
          electricity: fc.integer({ min: 5, max: 20 }),
          waste: fc.integer({ min: 5, max: 20 }),
        }),
        (answers) => {
          const expected =
            answers.transport + answers.ac + answers.diet + answers.electricity + answers.waste;
          expect(computeQuizScore(answers)).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('falls within the documented 25-100 range for real quiz options', () => {
    const min = computeQuizScore({ transport: 5, ac: 5, diet: 5, electricity: 5, waste: 5 });
    const max = computeQuizScore({ transport: 20, ac: 20, diet: 20, electricity: 20, waste: 20 });
    expect(min).toBe(25);
    expect(max).toBe(100);
  });
});
