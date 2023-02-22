import puppeteer from "puppeteer";
import NodeCache from "node-cache";

const url = "https://www.mercadolivre.com.br/";
const searchFor = "macbook";
const cache = new NodeCache({ stdTTL: 300 });

export async function appRoutes(app) {
  app.get("/product", async (req, res) => {
    
    //check if theres cache
    const cacheKey = `${searchFor}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for "${searchFor}"`);
      res.status(200).send(cachedResult);
      return;
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url);

    await page.setViewport({ width: 1080, height: 1024 });

    await page.waitForSelector("#cb1-edit");
    await page.type("#cb1-edit", searchFor);

    await Promise.all([
      page.waitForNavigation(),
      page.click(".nav-search-btn"),
    ]);

    const links = await page.$$eval(".ui-search-result__image > a", (el) =>
      el.map((link) => link.href)
    );

    let getProducts = [];

    for (let i = 0; i < 5; i++) {
      await page.goto(links[i]);
      await page.waitForSelector(".ui-pdp-title");
      await page.waitForSelector(".andes-money-amount__fraction");

      const title = await page.$eval(
        ".ui-pdp-title",
        (element) => element.innerText
      );

      const price = await page.$eval(
        ".andes-money-amount__fraction",
        (element) => element.innerText
      );

      if (title === undefined || price === undefined) {
        console.log("Error getting product info");
        return;
      }

      const seller = await page.evaluate(() => {
        const el = document.querySelector(".ui-pdp-action-modal__link > span");
        if (!el) return null;
        return el.innerText;
      });

      const product = {
        title: title,
        price: price,
        seller: seller ? seller : "No Seller",
      };

      getProducts.push(product);
    }

    await new Promise((r) => setTimeout(r, 2000));
    await browser.close();

    // Store the result in the cache
    cache.set(cacheKey, getProducts);

    res.status(201).send(getProducts);
  });
}
