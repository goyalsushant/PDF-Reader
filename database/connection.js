var MongoCLient = require('mongodb').MongoClient;

var dbUrl = ''

function createCollections(index) {
    MongoCLient.connect(dbUrl, (err, db) => {
        console.log("CONNECTED");
        files.forEach((element, index) => {
          db.db('ipu_result').createCollection('sem_' + (index+1), (err, res) => {
            if(err) throw err;
            console.log('Collection created');
          });
        });
        db.close();
    });
}

function insertDocuments(index, sem_arr) {
    MongoCLient.connect(dbUrl, (err, db) => {
        console.log("CONNECTED");
        db.db('ipu_result').collection('sem_' + (index+1)).insertMany(Object.keys(sem_arr[index]).map(function(_) { return sem_arr[index][_];})), function(err, res) {
        if(err) throw err;
        console.log(`Number of documents inserted in sem${index+1} : ` + res.insertedCount);
        }
    });
}

module.exports = {
    createCollection,
    insertDocuments
}