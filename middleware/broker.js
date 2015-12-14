var querystring = require('querystring');
var request = require('request');
var Promise = require('bluebird');
var libxmljs = require("libxmljs");
var url = require('url');
var util = require('util');
var _ = require('lodash');

/**
 *
 * @param req
 * @param res
 */
function getScores(req, res) {
    var nbcBaseUrl = "http://scores.nbcsports.com/ticker/data/gamesMSNBC.js.asp?";
    var today = getTodayDate();

    var nbcUrls = [];
    var teamNames = [];
    _.forOwn(req.query, function(teamName, sport) {
        if (!teamName) {
            return;
        }
        teamNames.push(teamName);
        var qs = setQueryString(sport, today);
        var nbcUrl = nbcBaseUrl + qs;
        nbcUrls.push(nbcUrl);
    });

    var result = {};
    Promise.map(nbcUrls, function(nbcUrl, index) {
        return getNbcData(nbcUrl)
            .then(function(data) {
                var myTeamName = teamNames[index];
                return parseNbcXML(data, formatTeamName(myTeamName));
            })
            .then(function(res) {
                var sport = url.parse(nbcUrl, true).query.sport;
                result[sport] = res;
            })
    })
        .then(function() {
            res.render('scoreboard', { title: "Scoreboard", result: result });
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

function parseNbcXML(data, myTeamName) {
    var dataJSON = JSON.parse(data);
    var isEPL = dataJSON.sport === 'EPL';
    var gamesXML = dataJSON.games;

    var gameResult = {
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
    };

    var foundTeam = false;
    for(var i = 0; i < gamesXML.length; i++) {
        var xmlDoc = libxmljs.parseXml(gamesXML[i]);

        var homeTeamNode,
            awayTeamNode,
            nameAttr;
        if(isEPL) {
            homeTeamNode = xmlDoc.get('(//home-team[@display_name="' + myTeamName + '"])[1]');
            awayTeamNode = xmlDoc.get('(//visiting-team[@display_name="' + myTeamName + '"])[1]');
            nameAttr = 'display_name';
        }
        else {
            homeTeamNode = xmlDoc.get('(//home-team[@nickname="' + myTeamName + '"])[1]');
            awayTeamNode = xmlDoc.get('(//visiting-team[@nickname="' + myTeamName + '"])[1]');
            nameAttr = 'nickname';
        }

        var myTeamNode, opponentNode;
        var myTeam, oppTeam;

        if (!homeTeamNode && !awayTeamNode) {
            continue;
        }
        else if (homeTeamNode) {
            myTeamNode = homeTeamNode;
            opponentNode = homeTeamNode.prevSibling();
            myTeam = gameResult.homeTeam;
            oppTeam = gameResult.awayTeam;
            foundTeam = true;
            break;
        }
        else if (awayTeamNode) {
            myTeamNode = awayTeamNode;
            opponentNode = awayTeamNode.nextSibling();
            myTeam = gameResult.awayTeam;
            oppTeam = gameResult.homeTeam;
            foundTeam = true;
            break;
        }
    }

    if(!foundTeam) {
        gameResult = { "message" : "There is no game today for the " + myTeamName }
    }
    else {
        myTeam.name       = myTeamNode.attr(nameAttr).value();
        var myScore       = myTeamNode.attr('score').value();
        myTeam.score      = (myScore.length === 0) ? "0" : myScore;
        var myChildNodes  = myTeamNode.childNodes();
        var myIndex       = myChildNodes.length - 1;
        myTeam.logo       = myChildNodes[myIndex].attr('gz-image').value();

        oppTeam.name      = opponentNode.attr(nameAttr).value();
        var oppScore      = opponentNode.attr('score').value();
        oppTeam.score     = (oppScore.length === 0) ? "0" : oppScore;
        var oppChildNodes = opponentNode.childNodes();
        var oppIndex      = oppChildNodes.length - 1;
        oppTeam.logo      = oppChildNodes[oppIndex].attr('gz-image').value();

        var gameStateNode = xmlDoc.get('//gamestate');
        var gameStatus = gameStateNode.attr('status').value();
        var gameTime   = gameStateNode.attr('gametime').value();
        gameResult.gamestate.status = gameStatus;
        gameResult.gamestate.gametime = gameTime;
    }

    return gameResult;
}


function formatTeamName(teamName) {
    teamName = teamName.trim().toLowerCase();
    var nameArr = teamName.split(' ');
    _.forEach(nameArr, function(name, index) {
        nameArr[index] = name.substring(0,1).toUpperCase() + name.substring(1);
    });
    return nameArr.join(' ');
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

module.exports = {
    getScores: getScores
};