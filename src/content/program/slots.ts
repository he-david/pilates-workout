import { hold, reps, type SlotPlan } from './build'

/** `until` is exclusive; 13 = through week 12. Arguments: id, from, until, base, step, max[, perSide|sets]. */
const E = 13

const slotA: SlotPlan = {
  slot: 'A',
  title: 'Légzés & középtest',
  warmup: [
    hold('lateral-breathing', 1, E, 120, 0, 120),
    reps('pelvic-curl', 1, E, 8, 1, 12),
    reps('knee-folds', 1, E, 6, 1, 10, true),
    reps('supine-spine-twist', 1, E, 6, 1, 10, true),
  ],
  main: [
    reps('hundred', 1, E, 50, 25, 100),
    reps('chest-lift', 1, 5, 8, 1, 12),
    reps('ring-chest-lift', 5, E, 8, 1, 12),
    reps('single-leg-circles', 1, 5, 4, 1, 8, true),
    reps('single-leg-stretch', 1, E, 6, 1, 12, true),
    reps('double-leg-stretch', 2, E, 6, 1, 12),
    reps('criss-cross', 3, E, 6, 1, 12, true),
    reps('shoulder-bridge', 1, 5, 6, 1, 10),
    reps('ball-bridge', 5, 9, 6, 1, 10),
    reps('ring-inner-thigh-press', 5, 9, 10, 1, 15),
    reps('band-rowing', 5, 9, 8, 1, 12),
    reps('bird-dog', 1, 6, 6, 1, 10, true),
    reps('spine-stretch-forward', 1, 5, 5, 1, 8),
    reps('swan', 1, 5, 4, 1, 8),
    hold('side-plank', 5, E, 15, 5, 30, 2),
    hold('swimming', 6, E, 20, 5, 30, 2),
    reps('saw', 7, E, 4, 1, 8, true),
    reps('teaser', 9, E, 3, 1, 6),
    reps('push-up', 9, E, 4, 1, 8),
    reps('leg-pull-front', 10, E, 4, 1, 8, true),
  ],
  cooldown: [
    hold('mermaid-childs-pose', 1, E, 90, 0, 90, 2),
    hold('figure-four-stretch', 1, 5, 45, 0, 45, 2),
    hold('supine-hamstring-stretch', 5, E, 45, 0, 45, 2),
  ],
}

const slotB: SlotPlan = {
  slot: 'B',
  title: 'Core & gerinc',
  warmup: [
    hold('lateral-breathing', 1, E, 120, 0, 120),
    reps('pelvic-curl', 1, E, 8, 1, 12),
    reps('cat-cow', 1, E, 6, 1, 10),
    reps('supine-spine-twist', 1, E, 6, 1, 10, true),
  ],
  main: [
    reps('hundred', 1, 5, 50, 25, 100),
    reps('ball-hundred', 5, E, 50, 25, 100),
    reps('roll-up', 3, E, 8, 1, 12),
    reps('single-leg-circles', 1, 5, 3, 1, 8, true),
    reps('band-leg-circles', 5, E, 4, 1, 8, true),
    reps('rolling-like-a-ball', 1, E, 6, 1, 12),
    reps('single-leg-stretch', 1, E, 8, 1, 12, true),
    reps('double-leg-stretch', 1, E, 6, 1, 12),
    reps('spine-stretch-forward', 1, 9, 4, 1, 8),
    reps('swan', 1, 7, 4, 1, 8),
    reps('saw', 6, E, 4, 1, 8, true),
    hold('swimming', 7, E, 20, 5, 30, 2),
    reps('corkscrew', 10, E, 3, 1, 6, true),
    reps('rollover', 11, E, 3, 1, 5),
    hold('forearm-plank', 1, E, 25, 5, 50, 3),
  ],
  cooldown: [hold('mermaid-childs-pose', 1, E, 480, 0, 480)],
}

const slotC: SlotPlan = {
  slot: 'C',
  title: 'Láb, far & egyensúly',
  warmup: [
    hold('lateral-breathing', 1, E, 120, 0, 120),
    reps('cat-cow', 1, E, 6, 1, 10),
    reps('knee-folds', 1, E, 6, 1, 10, true),
    reps('pelvic-curl', 1, E, 8, 1, 12),
  ],
  main: [
    reps('side-leg-lift', 1, E, 8, 1, 15, true),
    reps('clam', 1, E, 8, 1, 15, true),
    reps('shoulder-bridge', 1, 5, 8, 1, 12),
    reps('ball-bridge', 5, E, 8, 1, 12),
    reps('single-leg-circles', 1, 5, 4, 1, 8, true),
    reps('bird-dog', 1, 9, 6, 1, 10, true),
    reps('single-leg-stretch', 1, E, 6, 1, 10, true),
    reps('spine-stretch-forward', 1, 5, 5, 1, 8),
    reps('ball-wall-squat', 5, E, 8, 1, 15),
    reps('band-side-steps', 5, E, 8, 1, 12, true),
    reps('ring-inner-thigh-press', 5, E, 10, 1, 15),
    reps('criss-cross', 9, E, 6, 1, 12, true),
    hold('side-plank', 9, E, 15, 5, 30, 2),
    hold('standing-balance', 1, E, 20, 5, 40, 2),
  ],
  cooldown: [
    hold('kneeling-hip-flexor-stretch', 1, E, 45, 0, 45, 2),
    hold('figure-four-stretch', 1, E, 45, 0, 45, 2),
    hold('supine-hamstring-stretch', 5, E, 45, 0, 45, 2),
  ],
}

export const slotPlans: readonly SlotPlan[] = [slotA, slotB, slotC]
