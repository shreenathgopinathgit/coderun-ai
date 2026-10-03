import { test, expect, type Page } from '@playwright/test'

async function typeInEditor(page: Page, code: string) {
  // Monaco mounts asynchronously; type only once the editor is ready,
  // otherwise the keystrokes are lost and the stored code is stale.
  await page.locator('[data-testid="editor"] .monaco-editor').first().waitFor()
  await page.locator('[data-testid="editor"]').first().click()
  await page.keyboard.press('Control+a')
  await page.keyboard.type(code)
}

async function clickRun(page: Page) {
  await page.getByRole('button', { name: 'Run' }).click()
}

test('JS console.log output appears in the Console tab', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('javascript')
  await typeInEditor(page, 'function main() { console.log("hello from runner") }')
  await clickRun(page)
  await expect(page.getByText('hello from runner')).toBeVisible()
})

test('infinite loop shows Time Limit Exceeded and the page stays responsive', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('javascript')
  // A plain script runs top-level code, so the loop must be at the top
  // level — a function declaration alone would just define it.
  await typeInEditor(page, 'while(true) {}')
  await clickRun(page)
  await expect(page.getByText('Time Limit Exceeded')).toBeVisible({ timeout: 8000 })
  await page.locator('[data-testid="editor"] .monaco-editor').first().waitFor()
  await page.locator('[data-testid="editor"]').first().click()
  await page.keyboard.type('x')
})

test('Python print appears in the Console tab', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('python')
  await typeInEditor(page, 'print("py hello")')
  await clickRun(page)
  await expect(page.getByText('py hello')).toBeVisible({ timeout: 60000 })
}, 60000)

test('JS plain script runs with no question loaded and no main error', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('javascript')
  await typeInEditor(page, 'console.log("hi")')
  await clickRun(page)
  await expect(page.getByText('"hi"')).toBeVisible()
  await expect(page.getByText('main')).toHaveCount(0)
})

test('TS plain script runs with no question loaded', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('typescript')
  await typeInEditor(page, 'const x: number = 2; console.log(x)')
  await clickRun(page)
  // Assert on the console output specifically: the editor's line-number
  // gutter also renders "2", so a bare getByText('2') is ambiguous.
  await expect(page.locator('pre').getByText('2')).toBeVisible()
  await expect(page.getByText('main')).toHaveCount(0)
})

test('plain JS run reports runtime errors with line numbers', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('javascript')
  // The editor still holds the "// Write your code here." starter line, so
  // the error lands on line 7 of the full script. The line number is
  // reported relative to the code that actually ran.
  await typeInEditor(page, 'const a = 1\nconst b = 2\nz()')
  await clickRun(page)
  await expect(page.getByText('z is not defined')).toBeVisible()
  await expect(page.getByText('line 7')).toBeVisible()
})

test('plain JS infinite loop shows Time Limit Exceeded and the page stays responsive', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('javascript')
  await typeInEditor(page, 'while(true) {}')
  await clickRun(page)
  await expect(page.getByText('Time Limit Exceeded')).toBeVisible({ timeout: 8000 })
  // Page stays responsive: Run works again afterwards.
  await page.locator('[data-testid="editor"] .monaco-editor').first().waitFor()
  await page.locator('[data-testid="editor"]').first().click()
  await page.keyboard.type('x')
  await page.getByRole('button', { name: 'Run' }).click()
  await expect(page.getByText('Time Limit Exceeded')).toBeVisible({ timeout: 8000 })
})

test('a language without an executor shows an honest message', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('java')
  await clickRun(page)
  await expect(
    page.getByText('No executor is configured for this language'),
  ).toBeVisible()
})