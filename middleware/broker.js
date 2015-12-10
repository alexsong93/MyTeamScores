var querystring = require('querystring');
var request = require('request');
var Promise = require('bluebird');
var libxmljs = require("libxmljs");

function getScores(req, res) {
    var NBAteamNickname = req.query.NBA;
    var NHLteamNickname = req.query.NHL;

    var nbcBaseUrl = "http://scores.nbcsports.com/ticker/data/gamesMSNBC.js.asp?";
    var today = getTodayDate();
    //var today = "20151209";
    var qs = setQueryString('NBA', today);
    var nbcUrl = nbcBaseUrl + qs;

    return getNbcData(nbcUrl)
        .then(function(data) {
            var dataJSON = JSON.parse(data);
            var gamesXML = dataJSON.games;

            var result = {
                "NBA": {
                    "homeTeam": {
                        "name": "",
                        "score": "",
                        "logo": ""
                    },
                    "awayTeam": {
                        "name": "",
                        "score": "",
                        "logo": ""
                    },
                    "gamestate": {
                        "status": "",
                        "gametime": ""
                    }
                }
            };

            var foundTeam = false;
            for(var i = 0; i < gamesXML.length; i++) {
                var xmlDoc = libxmljs.parseXml(gamesXML[i]);
                var homeTeamNode = xmlDoc.get('(//home-team[@nickname="' + NBAteamNickname + '"])[1]');
                var awayTeamNode = xmlDoc.get('(//visiting-team[@nickname="' + NBAteamNickname + '"])[1]');
                var myTeamNode, opponentNode;
                var myTeam, oppTeam;

                if (!homeTeamNode && !awayTeamNode) {
                    continue;
                }
                else if (homeTeamNode) {
                    myTeamNode = homeTeamNode;
                    opponentNode = homeTeamNode.prevSibling();
                    myTeam = result.NBA.homeTeam;
                    oppTeam = result.NBA.awayTeam;
                    foundTeam = true;
                    break;
                }
                else if (awayTeamNode) {
                    myTeamNode = awayTeamNode;
                    opponentNode = awayTeamNode.nextSibling();
                    myTeam = result.NBA.awayTeam;
                    oppTeam = result.NBA.homeTeam;
                    foundTeam = true;
                    break;
                }
            }

            if(!foundTeam) {
                result = { "message" : "There is no game today for " + NBAteamNickname }
            }
            else {
                myTeam.name       = myTeamNode.attr('nickname').value();
                var myScore       = myTeamNode.attr('score').value();
                myTeam.score      = (myScore.length === 0) ? "0" : myScore;
                var myChildNodes  = myTeamNode.childNodes();
                var myIndex       = myChildNodes.length - 1;
                myTeam.logo       = myChildNodes[myIndex].attr('gz-image').value();

                oppTeam.name      = opponentNode.attr('nickname').value();
                var oppScore      = opponentNode.attr('score').value();
                oppTeam.score     = (oppScore.length === 0) ? "0" : oppScore;
                var oppChildNodes = opponentNode.childNodes();
                var oppIndex      = oppChildNodes.length - 1;
                oppTeam.logo      = oppChildNodes[oppIndex].attr('gz-image').value();

                var gameStateNode = xmlDoc.get('//gamestate');
                var gameStatus = gameStateNode.attr('status').value();
                var gameTime   = gameStateNode.attr('gametime').value();
                result.NBA.gamestate.status = gameStatus;
                result.NBA.gamestate.gametime = gameTime;
            }

            res.render('scoreboard', { title: "Scoreboard", result: result });
            return result;
        });
}

function setQueryString(sport, date) {
    var qsObj = {};
    qsObj.sport = sport;
    qsObj.period = date;
    return querystring.stringify(qsObj);
}

function getTodayDate() {
    var dateObj = new Date();
    var year = dateObj.getFullYear().toString();
    var month = (dateObj.getMonth() + 1).toString();
    var date = dateObj.getDate().toString();
    date = (date.length === 1) ? "0" + date : date;

    return year + month + date;
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