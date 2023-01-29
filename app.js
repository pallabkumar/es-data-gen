const express = require('express');
const fs = require('fs');
const voyages = JSON.parse(fs.readFileSync('voyages.json'));
const cmsData = JSON.parse(fs.readFileSync('cms-data.json'));

const app = express();
const PORT = 3000;

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://127.0.0.1:9200'
});

async function run () {
  voyages.packages.forEach((package, indx) => {
    const { packageCode, currencyCode, region, arrivalPortCode, departurePortCode, nameKey } = package;
    package.sailings.forEach(sailing => {
      const cms = cmsData.results.filter(data => data.externalId === packageCode);
      let imageLink = ""; let hightlighsTitle = "";
      if (cms && cms.length > 0) {
        const { squareHero } = cms[0];
        imageLink = squareHero ? squareHero['@link']: "";
        hightlighsTitle = cms[0].hightlighsTitle;
      }
      try {
        client.index({
          index: 'ecom-voyages-sailings',
          document: { ...sailing, packageCode, currencyCode, region, arrivalPortCode, departurePortCode, nameKey, image: imageLink, hightlighsTitle }
        });
      } catch(error) {
        console.log(error);
      }
    })
  });

  // here we are forcing an index refresh, otherwise we will not
  // get any result in the consequent search
  await client.indices.refresh({ index: 'ecom-voyages' });
}

run().catch(error => {
  console.log(error);
});

app.listen(PORT, (error) => {
  if (!error)
    console.log("Server is Successfully Running, and App is listening on port " + PORT)
  else
    console.log("Error occurred, server can't start", error);
});