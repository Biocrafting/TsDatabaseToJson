const fs = require('fs');
const mysql = require('mysql');

const configPath = __dirname + '\\dbconfig.json';
const resultPath = __dirname + '\\results\\';

loadFromFile(configPath)
    .then(getDatabaseInformations)
    .then(convertDbInfoToJson)
    .then(jsonString => writeToFile(resultPath, jsonString))
    .then(console.log('The file has been saved!'))


/**
 * This helper function loads the data from a given path. The loaded data will
 * be encoded with utf-8.
 * 
 * @param {string} filePath The path to the file, which should be loaded. 
 * 
 * @returns {Promise} Returns a promise which can be used to work with the loaded data or handle errors.
 */
function loadFromFile(filePath) {
   
    return new Promise(function(resolve, reject) {
        fs.readFile(filePath, 'utf8', function(err, data) {
            if (err) reject(err);
            else resolve(data);
        });     
    })    
}

function getDatabaseInformations(dbconfig) {

    return new Promise(function(resolve, reject) {
        const connection = mysql.createConnection(dbconfig);
        connection.connect();

        // TODO: Put some real sql stuff here.
        connection.query('GIVE ME SOME SQL STUFF TO WORK WITH', function (error, results, fields) {
            if (error) throw error;
            resolve(results)
        });

        connection.end();
    })     
}

function convertDbInfoToJson(dbInformations) {

    // TODO: Put some real parsing here.
    let resultJSON = '';

    resolve(resultJSON);
}

function writeToFile(path, string) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, string, (err) => {
            if (err) throw err;
            resolve();
          });        
    })     
}
