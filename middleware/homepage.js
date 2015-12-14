var fs = require('fs');

function render(req, res) {
    var list = [];
    var teamsObj = JSON.parse(fs.readFileSync(__dirname + '/../teamNames.json', 'utf8'));
    res.render('homepage', { title: "MyTeamScores", teams : teamsObj });
}

module.exports = {
    render: render
};
