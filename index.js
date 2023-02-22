import puppeteer from "puppeteer";

const url = "https://www.mercadolivre.com.br/";
const searchFor = "macbook";

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url);

  await page.setViewport({ width: 1080, height: 1024 });

  await page.waitForSelector("#cb1-edit");
  await page.type("#cb1-edit", searchFor);

  await Promise.all([page.waitForNavigation(), page.click(".nav-search-btn")]);

  const links = await page.$$eval(".ui-search-result__image > a", (el) =>
    el.map((link) => link.href)
  );

  let getProducts = [];

  for (const link of links) {
    await page.goto(link);
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

  console.log("ARRAY:", getProducts);

  await new Promise((r) => setTimeout(r, 3000));
  await browser.close();
};

main();
