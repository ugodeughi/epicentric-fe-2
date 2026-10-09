import { expect, test } from '@playwright/test'

// Needs the backend running (see README) and a dedicated test account.
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.use({ locale: 'en-US' })

async function fillLogin(page, pass) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(pass)
  await page.getByRole('button', { name: 'Log in' }).click()
}

test('the app is not reachable without a session', async ({ page }) => {
  await page.goto('/app/keys')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test.describe('with a test account', () => {
  test.skip(!email || !password, 'E2E_EMAIL and E2E_PASSWORD are not set')

  test('a wrong password shows an error and stays on the page', async ({ page }) => {
    await page.goto('/login')
    await fillLogin(page, `${password}-wrong`)

    await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.')

    // The eye button reveals and hides what was typed.
    const field = page.getByLabel('Password', { exact: true })
    await expect(field).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(field).toHaveAttribute('type', 'text')
    await expect(field).toHaveValue(`${password}-wrong`)
    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(field).toHaveAttribute('type', 'password')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('log in, keep the session across a reload, log out', async ({ page }) => {
    await page.goto('/app/keys')
    await fillLogin(page, password)

    // Back to the page that was asked for before signing in.
    await expect(page).toHaveURL(/\/app\/keys$/)
    await expect(page.getByText(email)).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Epikey' })).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()

    // Signed-in users never see the login page.
    await page.goto('/login')
    await expect(page).toHaveURL(/\/app\/keys$/)

    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/app/catalog')
    await expect(page).toHaveURL(/\/login\?redirect=/)
  })
})
