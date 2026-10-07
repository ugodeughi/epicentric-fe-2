// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ageOn, backendLanguage, isAdult, isoDay } from '../../app/utils/age'

const today = new Date(2026, 9, 7) // 7 October 2026

describe('age', () => {
  it('counts completed years', () => {
    expect(ageOn('2008-10-07', today)).toBe(18)
    expect(ageOn('2008-10-08', today)).toBe(17)
    expect(ageOn('1980-01-01', today)).toBe(46)
  })

  it('rejects missing or impossible dates', () => {
    expect(ageOn('', today)).toBeNull()
    expect(ageOn('2001-02-30', today)).toBeNull()
    expect(ageOn('07/10/2000', today)).toBeNull()
  })

  it('is adult from the 18th birthday', () => {
    expect(isAdult('2008-10-07', today)).toBe(true)
    expect(isAdult('2008-10-08', today)).toBe(false)
    expect(isAdult('', today)).toBe(false)
  })

  it('formats the local day and maps the locale to the backend language', () => {
    expect(isoDay(today)).toBe('2026-10-07')
    expect(backendLanguage('it')).toBe('italiano')
    expect(backendLanguage('en')).toBe('english')
  })
})
