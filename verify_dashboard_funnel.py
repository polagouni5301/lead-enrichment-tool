import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 1600})
        await page.goto('http://localhost:5173')

        # Go to Dashboard
        await page.click('text=Dashboard')
        await asyncio.sleep(2)

        # Scroll to funnel chart
        await page.evaluate("window.scrollTo(0, 1000)")
        await asyncio.sleep(1)

        await page.screenshot(path='/home/jules/verification/screenshots/dashboard_funnel_scroll.png')
        await browser.close()

asyncio.run(run())
