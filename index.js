import { add, format, isBefore, isValid, isWithinInterval, parseISO } from 'date-fns'

/**
 * Helper method for generating an EOL date formatted as YYYY-MM-dd
 * based on the provided release date.
 *
 * Logic is slightly complicated because we've had three different EOL
 * policies since 2020, so this function accounts for all three.
 *
 * @param {string} dateString release date of agent version, from the release notes front-matter field releaseDate
 * @returns {string} EOL date for provided release date
 */
export default function getEOLDate (dateString) {
  if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/) || !isValid(parseISO(dateString))) {
    // TODO: ask docs-eng if it's better to throw, or to skip an invalid entry
    throw new Error('releaseDate must be a valid date in YYYY-MM-DD format')
  }

  const releaseDate = new Date(dateString)
  let eolDate

  if (isBefore(releaseDate, new Date('2020-10-01'))) {
    eolDate = add(releaseDate, { years: 3, days: 1 })
  } else if (isWithinInterval(releaseDate, { start: new Date('2020-10-01'), end: new Date('2022-07-31') })) {
    eolDate = add(releaseDate, { years: 2, days: 1 })
  } else {
    // TODO: If EOL policy changes, make this another else-if with a start date of 2022-08-01
    eolDate = add(releaseDate, { years: 1, days: 1 })
  }

  return format(eolDate, 'yyyy-MM-dd')
}
