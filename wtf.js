const express = require('express');
const app = express();
const Promise = require('bluebird');
const morgan = require('morgan');
const axios = require('axios');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');
const sessions = require('./scoreAndLives.js');
const movie = require('./session_alt.js');
const session = require('express-session');
//dbConfig can be changed to whatever the database configuration file is named
var db = pgp({database: 'highscores', user:'postgres'});

// import handlebars
app.set('view engine', 'hbs');
//kube for CSS
app.use('/kube', express.static('node_modules/imperavi-kube/dist/css'));
app.use('/public', express.static('public'));

app.use(session({
  key: 'wtf.sess',
  secret: process.env.SESS_KEY,
  saveUninitialized: true,
  resave: true,
  cookie: {maxAge: 1000 * 60 * 60 * 24}
}));

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static('public'));

//get genre selection from form and set to variable 'genre'
app.post('/getGenre', function(request, response) {

    // gets proper genre from url
    if (request.body.genreChoice == 'All') {
      request.session.genre = '';
    } else {
      request.session.genre = '&with_genres=' + request.body.genreChoice;
    }
    console.log('genre: ' + request.session.genre);
    var base_url = 'https://api.themoviedb.org/3/discover/';
    var api_key = 'movie?api_key=' + process.env.API_KEY;
    var options = '&language=en&region=US&include_adult=false' + request.session.genre +'&page=1';
    let url = base_url + api_key + options;
    axios.get(url)
      .then(function (api) {
        console.log(api.data.total_pages);
        request.session.pageLimit = api.data.total_pages - 1;
        if (request.session.pageLimit > 1000) {
          request.session.pageLimit = 1000;
        } else {
          request.session.pageLimit = api.data.total_pages;
        }
        response.redirect('/game');
      })
});

// index.hbs should be renamed if different per paul or alston
//in response.render add context dictionary to pass img data to front end through hbs
app.get('/game', function(request, response) {
  // call new randoms before new api request
  console.log('pageLmt: '+ request.session.pageLimit);
  movie.Movies(request);
  request.session.page = request.newMovie();

  //set url parts as variables to be concatenated
  var base_url = 'https://api.themoviedb.org/3/discover/';
  var api_key = 'movie?api_key=' + process.env.API_KEY;
  var options = '&language=en&region=US&include_adult=false' + request.session.genre + '&page='
  let url = base_url + api_key + options + request.session.page[0];
  console.log(url);
axios.get(url)
    .then(function (api) {
      context = request.set_Movie_data(api);
      response.render('index.hbs', context);
    })

    .catch(function (error) {
        // console.error(error);
    });
});

app.post('/something', function(request, response, next) {
//maybe need a cookie from which to log the username for stretch goal
  request.session.username = request.body.playerName;
//high_scores should be whatever the table name is per jj
  db.query('INSERT INTO highscores VALUES (default, $1, $2)',[request.session.username, request.session.score] )
    .then(function() {
//highscores.hbs should be whatever frontend hbs has the highscores per paul or alston
      response.redirect('/highscores');
    })
    .catch(next);
});

app.get('/highscores', function(request, response, next) {
  db.any("SELECT * FROM highscores ORDER BY score DESC LIMIT 10")
    .then(function(results) {
      response.render('highscores.hbs', {layout: 'layout2', results:results});
    })
    .catch(next);
});

app.post('/guess', function(request, response, next) {
  console.log(request.body.answer);
  var answer = request.body.answer;
  var title2 = request.session.title[request.session.page[1]];
  if (answer == title2 && request.session.lives > 0) {
    sessions.updateSNL(request);
    request.correct();
    response.redirect('/game');
  } else {
    sessions.updateSNL(request);
    request.incorrect();
    if (request.session.lives <= 0) {
      response.redirect('/game_over');
    }
  }
});

app.get('/game_over', function(request, response) {
    response.render('game_over.hbs', {score:request.session.score})
});

app.get('/genres', function(request, response) {
  getGenres()
    .then(function(api) {
      response.send(api.data.genres);
    });
});

app.get('/', function (request, response) {
  sessions.initialSNL(request);
  axios.all([getGenres()])
    .then(axios.spread(function(api) {
      request.session.genre = request.body.genreChoice;
      response.render('home.hbs', {layout: 'layout2', genres: api.data.genres});
   }))
});

//Port 3000 is optional
app.listen(3000, function() {
  console.log('Example app listening on port 3000!')
});

//////////////////////////////

/**
 * @returns Promise that might have genres
 *   success: Contains Axios result with genres
 *   error: Contains error object
 */
function getGenres() {
  let url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.API_KEY}&language=en-US`
  console.log(url);

  return axios.get(url)
    .then(function(api) {
      console.log('Retrieved genres');
      return api;
    })
    .catch(function (error) {
      console.error(error);
      return Promise.reject(error);
    });
}
