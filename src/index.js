const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");
const Stream = require("stream");
const readline = require("readline");
const { exit } = require("process");

let json = { posts: [] };

function removeTags(str) {
  if (str === null || str === "") return false;
  else str = str.toString();
  let newstr = str.replace(/<(?!br\s*\/?)[^>]+>/g, "");
  return newstr.replaceAll('"', '"');
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
    let imgSelector = await page.$("img.MediaGrid__imageElement");
    if (imgSelector === null) {
      imgSelector = await page.$("img.MediaGrid__imageOld");
    }
    let backgroundImage = await (await imgSelector.getProperty("src")).toString();
    // let backgroundImage = await page.evaluate(
    //   (imgSelector) => window.getComputedStyle(imgSelector).backgroundImage,
    //   imgSelector
    // );
    let imageUrl = backgroundImage.substring(9, backgroundImage.length - 2);
    let element = await page.$("div.wall_post_text");
    let value = await page.evaluate((el) => el.innerHTML, element);

    fs.writeFile(`./posts/${i}.html`, removeTags(value) + `<img src="${imageUrl}">`, (err) => {
      if (err) throw err;
    });
    await arrow.click();
    i++;
    sleep(2000);
  }

  await browser.close();
}

async function makeRequest(i, data) {
  console.log(`Reading file [${i}/255]`);
  let content = data.toString();
  let title = content.split("<br>").shift();
  const requestBody = {
    title: title,
    contentFormat: "html",
    content: content,
    publishStatus: "public",
  };
  // 181cdeac17457501f2ecb1e978e740fa976164b903cb755e5025f6e8abc03b8f1
  const userId = "181cdeac17457501f2ecb1e978e740fa976164b903cb755e5025f6e8abc03b8f1";
  const url = `https://api.medium.com/v1/users/${userId}/posts`;
  // 28003d17a1391a5d0f71f1cedfab5e570c36ca40aec00c4b8f8da6e683f23d747
  const mediumToken = "28003d17a1391a5d0f71f1cedfab5e570c36ca40aec00c4b8f8da6e683f23d747";

  return await axios.post(url, requestBody, {
    headers: { Authorization: "Bearer " + mediumToken },
  });
}

async function postPosts() {
  let i = await checkLastPost();
  let counter = 0;
  while (i <= 255) {
    i++;
    counter++;
    if (counter % 15 === 0) {
      console.log("falling asleep");
      process.exit(1);
    }
    let data = fs.readFileSync(`/home/lukivan8/VSCprojects/VKCrawler/posts/${i}.html`);
    let response = await makeRequest(i, data);
    console.log(response.data.data.url);
    fs.appendFile(
      "/home/lukivan8/VSCprojects/VKCrawler/links.txt",
      `\n ${i} ${response.data.data.url}`,
      (err) => console.log(err)
    );
  }
}

async function checkLastPost() {
  let data = "no";
  data = await getLastLine("/home/lukivan8/VSCprojects/VKCrawler/links.txt", 1)
    .then((lastLine) => {
      return lastLine;
    })
    .catch((err) => {
      console.error(err);
    });
  data = data.split(" ");
  data = data[0] === "" ? data[1] : data[0];
  console.log(data);
  return Number(data);
}

getLastLine = (fileName, minLength) => {
  let inStream = fs.createReadStream(fileName);
  let outStream = new Stream();
  return new Promise((resolve, reject) => {
    let rl = readline.createInterface(inStream, outStream);

    let lastLine = "";
    rl.on("line", function (line) {
      if (line.length >= minLength) {
        lastLine = line;
      }
    });

    rl.on("error", reject);

    rl.on("close", function () {
      resolve(lastLine);
    });
  });
};

scrape();
