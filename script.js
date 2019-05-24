const fs = require('fs');
const mysql = require('mysql');

const configPath = __dirname + '\\dbconfig.json';
const resultPath = __dirname + '\\results\\';

const channelsParentsQuery = "SELECT value, channel_id, channel_parent_id FROM channels, channel_properties WHERE channel_id = id AND ident = 'channel_name' AND channel_properties.server_ID = '5'"
const userChannelGroupsQuery = "SELECT clients.client_nickname, channels.channel_id, groups_channel.name FROM channels, group_channel_to_client, clients, groups_channel WHERE clients.server_id ='5' AND id1 = clients.client_id AND id2 = channels.channel_id AND groups_channel.server_id = '5' AND (groups_channel.group_id = 29 OR groups_channel.group_id = 30)"

loadFromFile(configPath)
    .then(getDatabaseInformations)
    .then(convertDbInfoToJson)
    .then(jsonData => writeToFile(resultPath, jsonData))
    .then(console.log)
    .catch(console.log);


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
    const config = JSON.parse(dbconfig);

    return new Promise(function(resolve, reject) {
        const connection = mysql.createConnection(config);
        connection.connect();

        const channelsParentsPromise = new Promise(function(resolve, reject) {
            connection.query(channelsParentsQuery, function (error, results, fields) {
                if (error) throw error;
                else resolve(results)
            });
        });

        const userChannelGroupsPromise = new Promise(function(resolve, reject) {
            connection.query(userChannelGroupsQuery, function (error, results, fields) {
                if (error) throw error;
                else resolve(results)
            });
        });

        Promise.all([channelsParentsPromise, userChannelGroupsPromise])
            .then(values => {
                resolve(values);
            })

        connection.end();
    })     
}

function convertDbInfoToJson(dbInformations) {
    return new Promise(function(resolve, reject) {
        // TODO: Put some real parsing here.
        let resultJSON = dbInformations;

        console.log(dbInformations);
        const channels = getChannelWithChildren(dbInformations[0]);

        channels.children.map(channel => {
            setChannelRanks(channel, dbInformations[1]);
        })

        setChannelRanks(channels, dbInformations[1]);


        resolve(channels);
    });

    function getChannelWithChildren(channelInformations) {
        const rootChannel = {
            name: "root",
            id: 0,
            operators: [],
            admins: [],
            children: []
        };

        rootChannel.children = [...getChildChannel(rootChannel.id, channelInformations)];
        return rootChannel;

        function getChildChannel(parentId, channels) {
            const children = channels.filter(channel => channel.channel_parent_id == parentId)

            let convertedChildren = children.map(channel => {
                const convChannel = {
                    name: channel.value,
                    id: channel.channel_id,
                    operators: [],
                    admins: [],                    
                    children: []
                }
                convChannel.children = [...getChildChannel(convChannel.id, channels)];
                return convChannel;
            })
            
            return convertedChildren;
        }
    
    }

    function setChannelRanks(channel, rankInformations) {
        
        channel.operators = [...getOperators(channel.id, 'Operator',rankInformations)]; 
        channel.admins = [...getOperators(channel.id, 'Channel Admin',rankInformations)];

        channel.children.map(channel => {
            setChannelRanks(channel, dbInformations[1]);
        });

        function getOperators(channelId, channelGroup ,rankInfo) {
            let user = rankInfo.filter(rankI => rankI.name == channelGroup && rankI.channel_id == channelId);

            return user.map(e => e.client_nickname);
        }
    }
}

function writeToFile(path, json) {

    path += 'resultFile' + Date.now() + '.json';
    const string = JSON.stringify(json);

    return new Promise(function(resolve, reject) {
        fs.writeFile(path, string, (err) => {
            if (err) throw err;
            console.log('File as been saved!')
            resolve('true');
          });        
    })     
}
