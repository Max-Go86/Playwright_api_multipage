const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url, paths = [""] } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-web-security",
        "--single-process",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();
    let fullText = "";

    for (const path of paths) {
      const fullUrl = url.endsWith("/") ? url.slice(0, -1) + path : url + path;
      try {
        await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(2000);

        const content = await page.evaluate(() => {
          const article = document.querySelector("article");
          return article ? article.innerText : document.body.innerText;
        });

        fullText += `\n\n=== [${fullUrl}] ===\n\n${content}`;
      } catch (err) {
        console.error(`Erreur en visitant ${fullUrl}`, err.message);
        fullText += `\n\n=== [${fullUrl}] ===\n\n[Erreur de chargement : ${err.message}]`;
      }
    }

    res.json({ url, text: fullText.trim() });
  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ error: "Failed to scrape pages", detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Playwright API server running on port ${PORT}`);
});
