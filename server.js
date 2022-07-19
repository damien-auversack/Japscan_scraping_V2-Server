// Imports
const http = require('http');
const cheerio = require('cheerio');
const axios = require('axios');
const url = require('url');

// Infos
const nomSite = 'https://www.japscan.me';

const port = process.env.PORT || 5001;
// const port = 5001;

// CSS Selector
const CSS_SELECTOR_allMangas = 'div#chapters div.tab-pane.container h3.text-truncate a.text-dark';
const CSS_SELECTOR_firstPage = 'div#chapters div.tab-pane.container.active h3.text-truncate a.text-dark';

const CSS_SELECTOR_Synopsis = 'div#main div.card div.rounded-0 p.list-group-item';
const CSS_SELECTOR_urlImage = 'div#main div.card div.rounded-0 div.d-flex img';

// Begin

let arrayOfMangas=[];

const scrap = (allMangas) => {
  
  let scrapResult = new Promise( (resolve) => {

  axios.get(nomSite)
    .then(function (response) {

      let CSS_SELECTOR_NomUrlManga = (allMangas) ? CSS_SELECTOR_allMangas : CSS_SELECTOR_firstPage;

      // handle success
      let $ = cheerio.load(response.data);
      
      let objMangaSelect = $(CSS_SELECTOR_NomUrlManga);

      objMangaSelect.each( (index, element) => {
        let titreManga = $(element).text();
        titreManga = titreManga.split('.').join(' ');
        titreManga = titreManga.trim();
        let urlJapscanTmp = nomSite + $(element).attr('href');
        arrayOfMangas.push({titre:titreManga,urlJapscan:urlJapscanTmp});
      });         
      resolve(arrayOfMangas);
    });
  });
  return scrapResult;
};

// Scraping
// add Synopsis and url image to Manga object
const reqAddInfos = async (arrayOfMangas) => {

    let allUrl = arrayOfMangas.map((e)=>e.urlJapscan);
    let reqAddInfosResult = await Promise.all(
      allUrl.map( (endpoint) => axios.get(endpoint) )).then(
        axios.spread((...allData) => {
          
          for (let i = 0; i < allData.length; i++) {          
            let $ = cheerio.load(allData[i].data);	
            let synopsisMangaTmp = $(CSS_SELECTOR_Synopsis).text();
            arrayOfMangas[i].synopsis = synopsisMangaTmp;
            let urlMangaTmp = nomSite + $(CSS_SELECTOR_urlImage).attr('src');
            arrayOfMangas[i].urlImage = urlMangaTmp;
          }
        })
    );
    return arrayOfMangas;
};

/* Creating server */
let server = http.createServer(async (request, response) => {

  response.setHeader('Access-Control-Allow-Origin', 'https://damien-auversack.github.io');
  // response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.writeHead(200, { "Content-Type": "text/plain" });

  arrayOfMangas=[];

  const urlObjects = url.parse(request.url, true).query;
  let allMangas = (urlObjects.isAllMangas == "true");
  
  
  const scrapResult = await scrap(allMangas);
  
  // const scrapResultInfos = await reqAddInfos(scrapResult);
  
  response.end(JSON.stringify(scrapResultInfos));
  
});

server.listen(port);