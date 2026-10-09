import { expect, test } from '@playwright/test'

// Needs the backend running and a dedicated test account.
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.use({ locale: 'en-US' })

const submit = (page) => page.getByRole('button', { name: 'Sign up' })

async function fillSignup(page, { birthday = '1990-05-17', repeat = password, declareAge = true } = {}) {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Create an account' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Repeat the password').fill(repeat)
  await page.getByLabel('Date of birth').fill(birthday)
  await page.getByRole('checkbox', { name: 'I accept the terms of use' }).check()
  if (declareAge) await page.getByRole('checkbox', { name: 'I declare that I am of legal age' }).check()
}

test.describe('with a test account', () => {
  test.skip(!email || !password, 'E2E_EMAIL and E2E_PASSWORD are not set')

  test('the button stays disabled until the form is complete, as in the legacy app', async ({ page }) => {
    let calls = 0
    await page.route('**/api/users/signup', (route) => {
      calls += 1
      return route.abort()
    })

    // Everything filled except the age declaration.
    await fillSignup(page, { declareAge: false })
    await expect(submit(page)).toBeDisabled()

    const ageBox = page.getByRole('checkbox', { name: 'I declare that I am of legal age' })
    await ageBox.check()
    await expect(submit(page)).toBeEnabled()

    // The newsletter is optional.
    await expect(
      page.getByRole('checkbox', { name: 'I want to receive periodic product updates' }),
    ).not.toBeChecked()

    await page.getByRole('checkbox', { name: 'I accept the terms of use' }).uncheck()
    await expect(submit(page)).toBeDisabled()
    await page.getByRole('checkbox', { name: 'I accept the terms of use' }).check()

    // A minor cannot submit and is told why.
    await page.getByLabel('Date of birth').fill(`${new Date().getFullYear() - 1}-01-01`)
    await expect(submit(page)).toBeDisabled()
    await expect(page.getByRole('alert')).toContainText('at least 18 years old')

    // Mismatching passwords are caught on submit, before any request.
    await page.getByLabel('Date of birth').fill('1990-05-17')
    await page.getByLabel('Repeat the password').fill(`${password}x`)
    await submit(page).click()
    await expect(page.getByRole('alert')).toHaveText('The two passwords do not match.')

    expect(calls).toBe(0)
  })

  test('an email already registered is reported', async ({ page }) => {
    await fillSignup(page)
    await submit(page).click()
    await expect(page.getByRole('alert')).toHaveText('An account with this email already exists.')
    await expect(page).toHaveURL(/\/signup$/)
  })

  // The account creation itself is answered by a stub so that test runs do not pile up
  // users in the database; everything after it (sign-in, session) is real.
  test('after a successful signup the user is signed in', async ({ page }) => {
    let body
    await page.route('**/api/users/signup', (route) => {
      body = route.request().postDataJSON()
      return route.fulfill({
        json: { Data: 'OK_USER_CREATED', Result: 'OK', Success: true, ResultText: 'OK' },
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    })

    await fillSignup(page)
    await submit(page).click()

    await expect(page).toHaveURL(/\/app\/keys$/)
    await expect(page.getByText(email)).toBeVisible()
    expect(body).toEqual({ Email: email, Password: password, Birthday: '1990-05-17', Language: 'english' })
  })
})

test('an invalid confirmation link says so', async ({ page }) => {
  // The path used in the emails sent by the backend redirects to the new route.
  await page.goto('/confirm-account/not-a-real-code')
  await expect(page).toHaveURL(/\/confirm\/not-a-real-code$/)
  await expect(page.getByRole('alert')).toContainText('no longer valid')
})
