
let sampleData = [
  {
    blockNumber: '0',
    flatNumber: 'G1',
    residents: [ {firstName: 'og1' , lastName: ''}, {firstName: 'tg1' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'G2',
    residents: [ {firstName: 'og2' , lastName: ''}, {firstName: 'tg2' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'G3',
    residents: [ {firstName: 'og3' , lastName: ''}, {firstName: 'tg3' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'G4',
    residents: [ {firstName: 'og4' , lastName: ''}, {firstName: 'tg4' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'G5',
    residents: [ {firstName: 'og5' , lastName: ''}, {firstName: 'tg5' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'G6',
    residents: [ {firstName: 'og6' , lastName: ''}, {firstName: 'tg6' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'G7',
    residents: [ {firstName: 'og7' , lastName: ''}, {firstName: 'tg7' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'G8',
    residents: [ {firstName: 'og8' , lastName: ''}, {firstName: 'tg8' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F1',
    residents: [ {firstName: 'of1' , lastName: ''}, {firstName: 'tf1' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F2',
    residents: [ {firstName: 'of2' , lastName: ''}, {firstName: 'tf2' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F3',
    residents: [ {firstName: 'of3' , lastName: ''}, {firstName: 'tf3' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F4',
    residents: [ {firstName: 'of4' , lastName: ''}, {firstName: 'tf4' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F5',
    residents: [ {firstName: 'of5' , lastName: ''}, {firstName: 'tf5' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F6',
    residents: [ {firstName: 'of6' , lastName: ''}, {firstName: 'tf6' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F7',
    residents: [ {firstName: 'of7' , lastName: ''}, {firstName: 'tf7' , lastName: ''}  ]
  },
  {
    blockNumber: '0',
    flatNumber: 'F8',
    residents: [ {firstName: 'of8' , lastName: ''}, {firstName: 'tf8' , lastName: ''}  ]
  },
];

let tableName = 'flats_residents';
let sourceTable1 = 'flats';
let sourceTable2 = 'residents';
let flats;
let residents;

exports.seed = function(knex, Promise) {

  return knex(tableName)
    .del() // Deletes ALL existing entries
    .then(getFlats) // get all rows of Flats table
    .then(getResidents) // get all rows of Residents tables
    .then(addSamples);

  function getFlats() {
    return knex.select('id', 'block_number', 'flat_number').from(sourceTable1);
  }
  function getResidents(rows) {
    flats = rows;
    // console.log('Flats: '); console.log(rows);
    return knex.select('id', 'first_name', 'last_name').from(sourceTable2);
  }
  function addSamples(rows){
    residents = rows;
    // console.log('users: '); console.log(rows);
    let links = [];
    let link;
    let fid;
    let rid;
    sampleData.forEach(obj => {
      fid = getFlatIdFor(obj.blockNumber, obj.flatNumber);
      // console.log('Flat id: '); console.log(fid);
      obj.residents.forEach(eachResident => {
        rid = getResidentIdFor(eachResident.firstName, eachResident.lastName);
        // console.log('Resident id: '); console.log(rid);
        link = knex(tableName).insert({flat_id: fid, resident_id: rid});
        links.push( link );
      });
    });
    return Promise.all(links);
  }

  function getFlatIdFor(block, flat){
    let fFlats = flats.filter(each => each.block_number === block && each.flat_number === flat);
    // console.log('Flat..'); console.log(fFlats);
    return fFlats[0].id;
  }
  function getResidentIdFor(first, last) {
    let fResidents = residents.filter(each => each.first_name === first && each.last_name === last);
    // console.log('Resident..'); console.log(fResidents);
    return fResidents[0].id;
  }

}
