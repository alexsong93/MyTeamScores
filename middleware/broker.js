
var querystring = require('querystring');
var request = require('request');
var Promise = require('bluebird');
var libxmljs = require("libxmljs");

function getScores(req, res) {
    var nbcBaseUrl = "http://scores.nbcsports.com/ticker/data/gamesMSNBC.js.asp?";
    var qsObj = {};
    qsObj.sport = "NBA";
    qsObj.period = "20151208";
    var qs = querystring.stringify(qsObj);
    var nbcUrl = nbcBaseUrl + qs;

    return getNbcData(nbcUrl)
        .then(function(data) {
            var dataJSON = JSON.parse(data);
            var gamesXML = dataJSON.games;
            var xmlDoc = libxmljs.parseXml(gamesXML[1]);

            var homeTeamNode = xmlDoc.get('//home-team');
            var homeTeamName = homeTeamNode.attr('display_name').value();
            var homeTeamScore = homeTeamNode.attr('score').value();

            var awayTeamNode = xmlDoc.get('//visiting-team');
            var awayTeamName = awayTeamNode.attr('display_name').value();
            var awayTeamScore = awayTeamNode.attr('score').value();

            var result = "\nResults:\n\n " + homeTeamName + " " + homeTeamScore + " : "
                                    + awayTeamScore + " " + awayTeamName + "\n\n";
            res.status(200).send(result);
            return result;
        });
}


function getNbcData(nbcUrl) {
    return new Promise(function (resolve, reject) {
        request(nbcUrl, function (error, response, body) {
            if(error) {
                reject(error);
            }
            resolve(body);
        });
    })
}


module.exports = {
    getScores: getScores
};