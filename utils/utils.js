const cheerio = require('cheerio');
const dotenv = require('dotenv');
dotenv.config();
const log_level = process.env.LOG_LEVEL;

const MAX_RATE_LIMITING = 1000; //ms

const sleep = ms => new Promise(res => setTimeout(res, ms));

const getLinks = async (tags, page, requiredTags=null) => {
    await sleep(MAX_RATE_LIMITING);
    
    let content = await page.content();
    var $ = cheerio.load(content);

    parseLinks = [];

    $(tags).each(function(i, element){
        let a = $(this);
        let title = a.text();
        let url = a.attr('href');

        if ((requiredTags == null || requiredTags.includes(title)) 
            && !parseLinks.includes(url)) {
            parseLinks.push(url);
        }
    });
    return parseLinks;
}

const crawl = async (page, urlLists, callBack = null) => {
    for (let urlId in urlLists) {
        await sleep(MAX_RATE_LIMITING);

        const pageNextUrl = urlLists[urlId];
        await callBack(page, pageNextUrl);
        
        if (log_level == "DEBUG") break;
    }
}

const moveToNextPage = async (page, pageNextUrl, option={ waitUntil: 'load' }) => {
    try {
        await page.goto(pageNextUrl, {
            ... option,
            timeout: 0 // fix "Navigation timeout of 30000 ms"
        });
        return true;
      } catch (err) {
        console.log(`Invalid URL: ${pageNextUrl}`);
        console.log(err);
        return false;
      }
}

module.exports = { 
    getLinks, 
    crawl,
    moveToNextPage
};