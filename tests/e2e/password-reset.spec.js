import { expect, test } from '@playwright/test'

// Needs the backend, a dedicated test account and the local mail catcher (Mailpit).
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD
const mailpit = process.env.E2E_MAILPIT_URL || 'http://localhost:8025'
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api/'

test.use({ locale: 'en-US' })

/** Token of the most recent reset email received by the test account. */
async function latestResetToken(request) {
  const search = await request.get(`${mailpit}/api/v1/search`, { params: { query: `to:${email}`, limit: 1 } })
  const [message] = (await search.json()).messages
  const body = await (await request.get(`${mailpit}/api/v1/message/${message.ID}`)).json()
  return `${body.Text} ${body.HTML}`.match(/reset-password\/([0-9a-f-]{36})/)[1]
}

/**
 * Puts the original password back through the API, whatever state a run left behind
 * (the backend answers "must be different" when it is already the current one).
 */
async function restorePassword(request) {
  await request.post(`${apiBase}users/password/recover`, { data: { Email: email } })
  const token = await latestResetToken(request)
  await request.post(`${apiBase}users/password/reset/${token}`, { data: { NewPassword: password } })
}

async function requestLink(page) {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot your password?' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Send the link' }).click()
  await expect(page.getByRole('status')).toContainText(email)
}

async function choosePassword(page, token, value) {
  await page.goto(`/reset-password/${token}`)
  await page.getByLabel('New password', { exact: true }).fill(value)
  await page.getByLabel('Repeat the new password').fill(value)
  await page.getByRole('button', { name: 'Save the password' }).click()
}

test('an unknown address gets the same answer as a registered one', async ({ page }) => {
  await page.goto('/forgot-password')
  await page.getByLabel('Email').fill('nobody-here@example.com')
  await page.getByRole('button', { name: 'Send the link' }).click()

  await expect(page.getByRole('status')).toContainText('nobody-here@example.com')
})

test('an invalid link is refused and offers to request a new one', async ({ page }) => {
  await choosePassword(page, '00000000-0000-4000-8000-000000000000', 'whatever-123')

  await expect(page.getByRole('alert')).toContainText('no longer valid')
  await expect(page.getByRole('link', { name: 'Request a new link' })).toBeVisible()
})

test.describe('with a test account', () => {
  test.skip(!email || !password, 'E2E_EMAIL and E2E_PASSWORD are not set')

  test.beforeAll(async ({ request }) => {
    const reachable = await request.get(`${mailpit}/api/v1/info`).then(
      (r) => r.ok(),
      () => false,
    )
    test.skip(!reachable, 'Mailpit is not reachable')
    await restorePassword(request)
  })

  // The test changes the password of the shared account: always leave it as it was.
  test.afterAll(async ({ request }) => {
    await restorePassword(request)
  })

  test('reset the password from the emailed link and log in with it', async ({ page, request }) => {
    const temporary = `${password}-tmp`

    await requestLink(page)
    const token = await latestResetToken(request)

    // Client-side checks: the two fields must match, and the backend refuses the current password.
    await page.goto(`/reset-password/${token}`)
    await page.getByLabel('New password', { exact: true }).fill(temporary)
    await page.getByLabel('Repeat the new password').fill(`${temporary}x`)
    await page.getByRole('button', { name: 'Save the password' }).click()
    await expect(page.getByRole('alert')).toHaveText('The two passwords do not match.')

    await choosePassword(page, token, password)
    await expect(page.getByRole('alert')).toContainText('must be different')

    await choosePassword(page, token, temporary)
    await expect(page.getByRole('status')).toContainText('log in with your new password')

    // The link works once.
    await choosePassword(page, token, `${temporary}2`)
    await expect(page.getByRole('alert')).toContainText('no longer valid')

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(temporary)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/app\/catalog$/)
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
