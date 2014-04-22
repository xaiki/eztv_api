/*************************
**	Modules		**
**************************/

var request	=	require('request');
var cheerio	=	require('cheerio');

/*************************
**	Variables	**
**************************/

var BASE_URL	=	"http://eztv.it";
var SHOWLIST	=	"/showlist/";
var LATEST	=	"/sort/100/";
var SEARCH	=	"/search/";

exports.getAllShows	=	function(cb) {
	if(cb == null) return;
    	request(BASE_URL + SHOWLIST, function(err, res, html){

		if(err) return (err, null);

		var $ = cheerio.load(html);
		var title, show;
		var allShows = [];

		$('.thread_link').each(function(){
			var entry = $(this);
			var show = entry.text();
            var id = entry.attr('href').match(/\/shows\/(.*)\/(.*)\//)[1];
            var slug = entry.attr('href').match(/\/shows\/(.*)\/(.*)\//)[2];
			allShows.push({show: show, id: id, slug: slug});
		});

		return cb(null, allShows);
    	});
}

exports.getEpisodeMagnet	=	function(data, cb) {
	if(cb == null) return;
	var show = data.show;
	var season = data.season;
	var episode = data.episode;
	if(season.toString().length==1) season = "0"+season;

	if(episode.toString().length==1) episode = "0"+episode;

	var searchString = show +"+S"+ season + "E" + episode;

	request.post(BASE_URL + SEARCH, {form: {SearchString1: searchString}}, function (err, res, html) {
		if(err) return cb(err, null);

		var $ = cheerio.load(html);

		var show_rows = $('tr.forum_header_border[name="hover"]').filter(function(){
			var entry = $(this);
			return entry.find('img[title="Show Description about '+ show+'"]').length > 0;
		});
		
		if(show_rows.length === 0) return cb("Show Not Found", null);

		var episode_row = show_rows.filter(function() {
			var entry = $(this);
			return entry.text().indexOf("S"+season+"E"+episode) !== -1;
		});

		if(episode_row.length === 0) return cb("Episode Not Found", null);

		var magnet_link = episode_row.children('td[align="center"]').children('a').first().attr('href');
		return cb(null, magnet_link);
	});
};
