const puppeteer = require('puppeteer');
const utils = require('./utils/utils');
const dotenv = require('dotenv');
const cheerio = require('cheerio');
const Car = require('./models/car');
const client = require('./elastic')

dotenv.config();

const initUrls = [ "https://www.carlist.my" ];
const requiredTags = [ "Used Cars" ];
const extractBodyTypes = [
  "Gran Coupe", "Cab Chassis", "Limousine",
  "Sedan", "SUV", "Hatchback", "MPV", "Pickup Truck", "Coupe",
  "Van", "Convertible", "Lorry", "Wagon", "Bus", "Roadster", 
  "Cabriolet"
]


const starter = async (page, pageNextUrl) => {
  const valid = await utils.moveToNextPage(page, pageNextUrl);

  if (!valid) return;

  // move to used cars list
  const urlLists = await utils.getLinks('a', page, requiredTags);
  await utils.crawl(page, urlLists, parseCarLists);
}

const parseCarLists = async (page, pageNextUrl) => {
  const valid = await utils.moveToNextPage(page, pageNextUrl);

  if (!valid) return;
  
  carUrlList = await utils.getLinks('a.ellipsize.js-ellipsize-text', page);
  await utils.crawl(page, carUrlList, parseCar);
}

const parseCar = async (page, pageNextUrl) => {
  const valid = await utils.moveToNextPage(page, pageNextUrl);

  if (!valid) return;

  let content = await page.content();
  var $ = cheerio.load(content);

  const body = $('body');

  var car = new Car();
  
  const header = body.find('#listing-detail div h1').text();
  const words = header.split(" ");
  for (const word of words) {
    if (extractBodyTypes.includes(word)) {
      car.body_type = word;
      break;
    }
  }
  car.ad_id = pageNextUrl.split("/").pop().replace(/\?.*$/, '');
  car.brand = body.find('#listing-detail div ul li:nth-child(3) a span').text();
  car.color = body.find('div.owl-stage-outer div div:nth-child(4) div div div span.u-text-bold.u-block').text();
  car.condition = body.find('div.owl-stage-outer div div:nth-child(1) div div div span.u-text-bold.u-block').text();;
  car.currency = body.find('#details-gallery div.listing__item-price h3').text();
  car.direct_injection = body.find('#tab-specifications div:nth-child(3) div:nth-child(10) span:nth-child(2)').text();
  car.distance = body.find('div.owl-stage-outer div div:nth-child(4) div div div span.u-text-bold.u-block').text();
  car.distance_range = body.find('div.owl-stage-outer div div:nth-child(4) div div div span.u-text-bold.u-block').text();
  car.distance_unit = body.find('div.owl-stage-outer div div:nth-child(4) div div div span.u-text-bold.u-block').text().split(' ').pop();
  car.engine = body.find('#tab-specifications div:nth-child(3) div:nth-child(2) span:nth-child(2)').text();
  car.engine_type = body.find("#tab-specifications div:nth-child(3) div:nth-child(9) span:nth-child(2)").text();
  car.engine_unit = body.find('#tab-specifications div:nth-child(3) div:nth-child(2) span:nth-child(1)').text().split(" ")[1];

  await client.index(car);
}

const run = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    devtools: true,
    args: ['--disable-features=site-per-process'] // fix "Navigating frame was detached"
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    process.env.BROWSER_AGENT
  );
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
  });

  await utils.crawl(page, initUrls, starter);
  
  await browser.close();
};

run();