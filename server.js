// Imports
const http = require("http");
const cheerio = require("cheerio");
const axios = require("axios");
const url = require("url");

// Infos
const nomSite = "https://www.japscan.me";

// const port = process.env.PORT || 5001;
const port = 5001;

// CSS Selector
const CSS_SELECTOR_allMangas =
  "div#chapters div.tab-pane.container h3.text-truncate a.text-dark";
const CSS_SELECTOR_firstPage =
  "div#chapters div.tab-pane.container.active h3.text-truncate a.text-dark";

const CSS_SELECTOR_Synopsis =
  "div#main div.card div.rounded-0 p.list-group-item";
const CSS_SELECTOR_urlImage = "div#main div.card div.rounded-0 div.d-flex img";

// Begin

let arrayOfMangas = [];

const scrap = (allMangas) => {
  let scrapResult = new Promise((resolve) => {
    axios.get(nomSite).then(function (response) {
      let CSS_SELECTOR_NomUrlManga = allMangas
        ? CSS_SELECTOR_allMangas
        : CSS_SELECTOR_firstPage;

      // handle success
      let $ = cheerio.load(response.data);
      let objMangaSelect = $(CSS_SELECTOR_NomUrlManga);
      objMangaSelect.each((index, element) => {
        let titreManga = $(element).text();
        titreManga = titreManga.split(".").join(" ");
        titreManga = titreManga.trim();
        let urlJapscanTmp = nomSite + $(element).attr("href");
        arrayOfMangas.push({ titre: titreManga, urlJapscan: urlJapscanTmp });
      });
      resolve(arrayOfMangas);
    });
  });
  return scrapResult;
};

// Scraping
// add Synopsis and url image to Manga object
const reqAddInfos = async (arrayOfMangas) => {
  for (let i = 0; i < arrayOfMangas.length; i++) {
    arrayOfMangas[i].urlImage = await getCoverByTitle(arrayOfMangas[i].titre);
    console.log(
      `${(((i + 1) / arrayOfMangas.length) * 100).toFixed(2)}% | ${i + 1}/${
        arrayOfMangas.length
      }`
    );
    // console.log(arrayOfMangas[i].urlImage);
  }

  // let allUrl = arrayOfMangas.map((e) => e.urlJapscan);
  // let reqAddInfosResult = await Promise.all(
  //   allUrl.map((endpoint) => axios.get(endpoint))
  // ).then(
  //   axios.spread((...allData) => {
  //     for (let i = 0; i < allData.length; i++) {
  //       let $ = cheerio.load(allData[i].data);
  //       let synopsisMangaTmp = $(CSS_SELECTOR_Synopsis).text();
  //       arrayOfMangas[i].synopsis = synopsisMangaTmp;
  //       let urlMangaTmp = nomSite + $(CSS_SELECTOR_urlImage).attr("src");
  //       arrayOfMangas[i].urlImage = urlMangaTmp;
  //       console.log(arrayOfMangas[i].urlImage);
  //     }
  //   })
  // );

  return arrayOfMangas;
};

const getCoverByTitle = async (title) => {
  title = title.replaceAll("’", "");
  title = title.replaceAll("'", "");
  title = title.replaceAll('"', "");
  title = title.replaceAll(" ", "%20");

  let url = "https://api.mangadex.org/manga";

  let urlTitle = url + "?title=" + title;
  let idManga = await new Promise((resolve) => {
    axios
      .get(urlTitle)
      .then((response) => {
        let tmp = response.data.data[0];
        let tmp2;
        if (tmp) {
          tmp2 = tmp.id;
        } else {
          tmp2 = null;
        }

        resolve(tmp2);
      })
      .catch((e) => {
        resolve(null);
      });
  });

  url = "https://api.mangadex.org/cover";

  if (!idManga) {
    return "https://www.northernlightspizza.com/wp-content/uploads/2017/01/image-placeholder.jpg";
  }

  let urlIdCover = url + "?limit=1&manga%5B%5D=" + idManga;

  let endUrl = await new Promise((resolve) => {
    axios
      .get(urlIdCover)
      .then((response) => {
        let res = response.data.data[0].attributes.fileName;
        resolve(res);
      })
      .catch((e) => {});
  });

  let urlCover = `https://mangadex.org/covers/${idManga}/${endUrl}`;

  return urlCover;
};

/* Creating server */
let server = http.createServer(async (request, response) => {
  console.log("Connection...");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.writeHead(200, { "Content-Type": "application/json" });

  arrayOfMangas = [];

  const urlObjects = url.parse(request.url, true).query || "";
  let allMangas = urlObjects.isAllMangas == "true";
  // console.log("url value : " + allMangas);

  const scrapResult = await scrap(allMangas);

  const truncatedAllMangas = scrapResult.slice(0, 100);

  const scrapResultInfos = await reqAddInfos(truncatedAllMangas);
  console.log("Send...");
  response.end(JSON.stringify(scrapResultInfos));
});

server.listen(port);
