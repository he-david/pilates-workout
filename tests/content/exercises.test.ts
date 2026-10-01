import { describe, expect, it } from 'vitest'
import { exercises, getExercise } from '../../src/content/exercises'

const nonEmpty = (s: string) => s.trim().length > 0

describe('exercise library', () => {
  it('has around 40 exercises', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(38)
  })

  it('has unique kebab-case ids', () => {
    const ids = exercises.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it.each(exercises.map((e) => [e.id, e] as const))('%s has all fields filled', (_id, e) => {
    for (const s of [e.nameHu, e.nameEn, e.easier, e.harder, e.cue]) expect(nonEmpty(s)).toBe(true)
    expect(e.focus.length).toBeGreaterThan(0)
    expect(e.equipment.length).toBeGreaterThan(0)
    expect(e.steps.length).toBeGreaterThanOrEqual(3)
    expect(e.mistakes.length).toBeGreaterThanOrEqual(2)
    for (const s of [...e.focus, ...e.steps, ...e.mistakes]) expect(nonEmpty(s)).toBe(true)
  })

  it('every exercise mentions breathing in its steps or cue', () => {
    for (const e of exercises) {
      const text = [...e.steps, e.cue].join(' ').toLowerCase()
      expect(text, e.id).toMatch(/légz|lélegz/)
    }
  })

  it('has unique Hungarian names', () => {
    const names = exercises.map((e) => e.nameHu)
    expect(new Set(names).size).toBe(names.length)
  })

  it('contains every exercise named in the designs (hu + en)', () => {
    const fromDesign: [string, string][] = [
      ['Pilates-légzés', 'Lateral Breathing'],
      ['Medenceemelés', 'Pelvic Curl'],
      ['Macska–tehén', 'Cat–Cow'],
      ['Fekvő gerinccsavarás', 'Supine Spine Twist'],
      ['Százas', 'The Hundred'],
      ['Felgördülés', 'Roll Up'],
      ['Egylábas körzés', 'Single Leg Circles'],
      ['Gurulás labdaként', 'Rolling Like a Ball'],
      ['Egylábas nyújtás', 'Single Leg Stretch'],
      ['Kétlábas nyújtás', 'Double Leg Stretch'],
      ['Gerincnyújtás előre', 'Spine Stretch Forward'],
      ['Hattyú', 'Swan'],
      ['Alkartámasz', 'Forearm Plank'],
      ['Sellő nyújtás + gyermekpóz', "Mermaid · Child's Pose"],
    ]
    for (const [hu, en] of fromDesign) {
      expect(
        exercises.some((e) => e.nameHu === hu && e.nameEn === en),
        hu,
      ).toBe(true)
    }
  })

  it('names the phase 3 repertoire', () => {
    for (const n of ['Teaser', 'Átfordulás', 'Dugóhúzó', 'Fekvőtámasz']) {
      expect(
        exercises.some((e) => e.nameHu === n),
        n,
      ).toBe(true)
    }
  })

  it('covers ball, ring and band variants', () => {
    for (const eq of ['ball', 'ring', 'band'] as const) {
      expect(
        exercises.some((e) => e.equipment.includes(eq)),
        eq,
      ).toBe(true)
    }
  })

  it('Roll Up matches design 04', () => {
    const r = getExercise('roll-up')
    expect(r?.focus).toEqual(['Has', 'gerinc'])
    expect(r?.easier).toBe('Hajlított térd, gumiszalag a talp körül, a kéz segít.')
    expect(r?.harder).toBe('Kis labda a kezek között, 5–5 mp-es tempó.')
    expect(r?.mistakes).toHaveLength(3)
    expect(r?.steps).toHaveLength(4)
  })

  it('getExercise returns undefined for unknown ids', () => {
    expect(getExercise('nope')).toBeUndefined()
  })
})
