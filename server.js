// Imports
const http = require('http');
const request = require('request');
const cheerio = require('cheerio');

// Infos
const nomSite = 'https://www.japscan.ws';
let allMangas = false;

const port = process.env.PORT || 5000;

// CSS Selector
const CSS_SELECTOR_allMangas = 'div#chapters div.tab-pane.container h3.text-truncate a.text-dark';
const CSS_SELECTOR_firstPage = 'div#chapters div.tab-pane.container.active h3.text-truncate a.text-dark';

const CSS_SELECTOR_NomUrlManga = (allMangas) ? CSS_SELECTOR_allMangas : CSS_SELECTOR_firstPage;
const CSS_SELECTOR_Synopsis = 'div#main div.card div.rounded-0 p.list-group-item';
const CSS_SELECTOR_urlImage = 'div#main div.card div.rounded-0 div.d-flex img';

// Class
class Manga {
  constructor() {
    this.titre = "";
    this.synopsis = "";
    this.urlImage = "";
    this.urlJapscan = ""
  }
  setTitre(titre) {
    this.titre = titre;
  }
  setSynopsis(synopsis) {
    this.synopsis = synopsis;
  }
  setUrlImage(urlImage) {
    this.urlImage = urlImage;
  }
  setUrlJapscan(urlJapscan) {
    this.urlJapscan = urlJapscan;
  }
}

// Begin

let arrayOfMangas=[];
let manga = new Manga();

// Scraping
function scrap() {
  return new Promise(resolve => {
      request(nomSite, function (error, response, html) {
          if (!error && response.statusCode == 200) {
              let $ = cheerio.load(html);
              let objMangaSelect = $(CSS_SELECTOR_NomUrlManga);

              objMangaSelect.each(function (index, element) {
                  let titreManga = $(element).text();
                  titreManga = titreManga.split('.').join(' ');
                  titreManga = titreManga.trim();
                  let urlJapscan = nomSite + $(element).attr('href');

                  let manga = new Manga();
                  manga.setTitre(titreManga);
                  manga.setUrlJapscan(urlJapscan);

                  arrayOfMangas.push(manga);

              });                             
              resolve(arrayOfMangas);
          }
      });
  });
}

// add Synopsis and url image to Manga object
function reqAddInfos(arrayOfMangas) {
  return new Promise(resolve => {
    for (let i = 0; i < arrayOfMangas.length; i++) {
      
        request(arrayOfMangas[i].urlJapscan, function (error2, response2, html2) {
          if (!error2 && response2.statusCode == 200) {
            
            let $ = cheerio.load(html2);	

            let synopsisMangaTmp = $(CSS_SELECTOR_Synopsis).text();
            arrayOfMangas[i].setSynopsis(synopsisMangaTmp);

            let urlMangaTmp = nomSite + $(CSS_SELECTOR_urlImage).attr('src');
            arrayOfMangas[i].setUrlImage(urlMangaTmp);
            if(i == arrayOfMangas.length-1) {
              return true; 
            }
          }
        });       
    }
    resolve(arrayOfMangas);
  });
}

/* Creating server */
let server = http.createServer(async function (request, response) {
  arrayOfMangas=[];
  const scrapResult = await scrap();
  const scrapResultInfos = await reqAddInfos(scrapResult);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.writeHead(200, { "Content-Type": "text/plain" });
  setTimeout(()=>{
    response.end(JSON.stringify(scrapResultInfos));
  }, 5000);
  
});

server.listen(port);