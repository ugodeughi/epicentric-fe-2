export const LEGAL_AGE = 18

/**
 * Completed years between a birth date and a reference day.
 * @param {string} birthday YYYY-MM-DD
 * @param {Date} [today]
 * @returns {number | null} null when the date is missing or not a real calendar day
 */
export function ageOn(birthday, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday ?? '')
  if (!match) return null

  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null

  const hadBirthdayThisYear =
    today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day)
  return today.getFullYear() - year - (hadBirthdayThisYear ? 0 : 1)
}

/** @param {string} birthday YYYY-MM-DD */
export function isAdult(birthday, today = new Date()) {
  const age = ageOn(birthday, today)
  return age !== null && age >= LEGAL_AGE
}

/** Local calendar day as YYYY-MM-DD (for the `max` of date inputs). */
export function isoDay(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Backend language id for an app locale. */
export function backendLanguage(locale) {
  return locale === 'it' ? 'italiano' : 'english'
}
