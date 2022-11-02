const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");
let json = { posts: [] };

function removeTags(str) {
  if (str === null || str === "") return false;
  else str = str.toString();
  let newstr = str.replace(/<(?!br\s*\/?)[^>]+>/g, "");
  return newstr.replaceAll('"', '\"');
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

let title;
/**
 * TODO:
 * - Вытащить картинки и составить json картинки к посту +заголовок
 * - Загрузить посты на медиум
 */
async function scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // https://vk.com/audio?w=wall-178733319_7098
  await page.goto("https://vk.com/audio?w=wall-178733319_7081");
  let i = 1;
  //https://vk.com/audio?w=wall-178733319_11628
  while (page.url() !== "https://vk.com/audio?w=wall-178733319_11628") {
    sleep(2000);
    await page.waitForSelector("div#wl_post");
    let currentUrl = page.url();
    console.log(`Current post: ${currentUrl} [${i}/250]`);
    let arrow = await page.$("div#wk_left_arrow_bg");
    if (
      (await page.$("div.article_snippet__image_wrap")) !== null ||
      (await page.$("div.media_voting_header")) !== null ||
      (await page.$("div.wall_marked_as_ads")) !== null
    ) {
      await arrow.click();
      sleep(2000);
      continue;
    }
    let imgSelector = await page.$("a.image_cover");
    let backgroundImage = await page.evaluate(
      (imgSelector) => window.getComputedStyle(imgSelector).backgroundImage,
      imgSelector
    );
    let imageUrl = backgroundImage.substring(5, backgroundImage.length - 2);
    let element = await page.$("div.wall_post_text");
    let value = await page.evaluate((el) => el.innerHTML, element);

    fs.writeFile(
      `./posts/${i}.html`,
      removeTags(value) + `<img src=\"${imageUrl}\">`,
      (err) => {
        if (err) throw err;
      }
    );
    await arrow.click();
    i++;
    sleep(2000);
  }

  await browser.close();
}

function postPosts() {
  let i = 0;
  while (i <= 250) {
    if(i%15 === 0){
      sleep(1000*60*60*24);
    }
    i++;
    fs.readFile(`./posts/${i}.html`, (err, data) => {
      if (!err) {
        let content = data.toString();
        console.log(content);
        let title = content.split("<br>").shift();
        const requestBody = {
          title: title,
          contentFormat: "html",
          content: content,
          publishStatus: "public",
        };
        const userId =
          "1a4dfb84ee6dc159df5f31f00fdaac504ccdae774e13a15f3df413cdf576e66cb";
        const url = `https://api.medium.com/v1/users/${userId}/posts`;
        const mediumToken =
          "2318c37b16cb442b27e918005317a59d1495cc3de751e4b5092681370bc88e71d";

        let request = axios.post(url, requestBody, {
          headers: { Authorization: "Bearer " + mediumToken },
        });
        sleep(2000);
        console.log(request);
      } else {
        console.log(err);
      }
    });
  }
}

scrape();
