const request = require("request");
const requestPromise = require("request-promise");
const cheerio = require("cheerio");
const fs = require("fs");
const {Parser}= require('json2csv');

// arrays
let empresasArray = [];
let paginacionArray = [];
let resultObject = [];

(async () => {
  try {
    //get request
    let response = await requestPromise(
      "https://chileservicios.com/industrias/tecnologias-de-la-informacion/"
    );
    let $ = cheerio.load(response);
    const pageNumber= parseInt($('ul.pagination > li').last().prev().find('a').text());
    for(let i = 0; i <pageNumber; i++){
      if(paginacionArray.length == 0){
        paginacionArray.push("https://chileservicios.com/industrias/tecnologias-de-la-informacion/"
        )
      }else {
          paginacionArray.push(`https://chileservicios.com/industrias/tecnologias-de-la-informacion/page/${i+1}`)
        }
      }
    console.log(`Pagination ARRAY has ${paginacionArray.length} LINKS to scrape`);

      for(let url of paginacionArray){
        response= await requestPromise(url);
        $= await cheerio.load(response);
        $('div[class= "card-body"] >a').each(function(){
          empresasArray.push($(this).attr('href'))
        });
      }
      console.log(`Empresas ARRAY has ${empresasArray.length} LINKS to scrape`);

      for(let url of empresasArray){
        response= await requestPromise(url);
        $= await cheerio.load(response)
        let title= $('div[class="card-header"] > h1').text();
        let description= $('#page > div > div > div.col-lg-8.my-2 > div > div.card-body > div > div.col-md-8.my-2').text().trim();
        let phone= $('#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(2)').text();
        let email= $('#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(3)').text().trim();
        let webpage= $('#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(4)').text().trim();

        resultObject.push({
          titulo: title,
          telefono: phone,
          correo: email,
          pagina: webpage,
          descripcion: description
        });
        let data= JSON.stringify(resultObject);
        fs.writeFileSync('resultObject.json', data)
        console.log(`Item scrapped`);
      }
      //declarar campos
      const fields= ['titulo', 'telefono', 'correo', 'pagina','descripcion'];
      //crear instancia del parser de json2csv
      const json2csvParser = new Parser({
        fields: fields, // I SPECIFY THE FIELDS THAT I NEED
        defaultValue: "No info", // THIS IS THE DEFAULT VALUE WHEN THERE IS NO INFO IN THE FIELD
      });
  
      const csv = json2csvParser.parse(resultObject);
      fs.writeFileSync(`./results.csv`, csv, "utf-8");
      console.log("Done JSON to CSV...".bgGreen.black);

  } catch (error) {
    console.error(error);
  }
})();
