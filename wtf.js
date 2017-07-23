const express = require('express');
const app = express();
const Promise = require('bluebird');
const morgan = require('morgan');
const axios = require('axios');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');
const Status = require('./scoreAndLives.js');
const Selector = require('./session_alt.js');
const session = require('express-session');
//dbConfig can be changed to whatever the database configuration file is named
var db = pgp({database: 'highscores', user:'postgres'});
// import handlebars
app.set('view engine', 'hbs');
//kube for CSS
app.use('/kube', express.static('node_modules/imperavi-kube/dist/css'));
app.use('/public', express.static('public'));
//initializes session
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

/*
*  Get Routes
*/

// homepage route
app.get('/', function (request, response) {
  var status = new Status(request.session);
  status.Initialize();

  axios.all([getGenres()])
    .then(axios.spread(function(api) {
      status.session.genre = request.body.genreChoice;
      response.render('home.hbs', {layout: 'layout2', genres: api.data.genres});
   }))
});

// main game route that makes api call and displays game questions
app.get('/game', function(request, response, next) {
  var select = new Selector(request.session, true);
  var status = new Status(request.session);
  // call new randoms before new api request
  select.Movie();
  //set url parts as variables to be concatenated
  var base_url = 'https://api.themoviedb.org/3/discover/';
  var api_key = 'movie?api_key=' + process.env.API_KEY;
  var options = '&language=en&region=US&include_adult=false' + status.session.genre + '&page='
  let url = base_url + api_key + options + select.page;

axios.get(url)
    .then(function (api) {
      context = select.MovieData(api);
      context.score = status.session.score;
      context.lives = status.session.lives;
      response.render('index.hbs', context);
    })
    .catch(next);
});

// lists high scores from postgreSQL
app.get('/highscores', function(request, response, next) {
  db.any("SELECT * FROM highscores ORDER BY score DESC LIMIT 10")
    .then(function(results) {
      response.render('highscores.hbs', {layout: 'layout2', results:results});
    })
    .catch(next);
});

// route that renders game over screen when user chooses the incorrect movie
app.get('/game_over', function(request, response) {
    var status = new Status(request.session);
    response.render('game_over.hbs', {score:status.session.score})
});

// route created for testing only
app.get('/genres', function(request, response) {
  getGenres()
    .then(function(api) {
      response.send(api.data.genres);
    });
});

/*
*  Post Routes
*/

//get genre selection from form and set to variable 'genre'
app.post('/getGenre', function(request, response) {
    var select = new Selector(request.session);
    var status = new Status(request.session);
    // gets proper genre from url
    if (request.body.genreChoice == 'All') {
      status.session.genre = '';
    } else {
      status.session.genre = '&with_genres=' + request.body.genreChoice;
    }
    var base_url = 'https://api.themoviedb.org/3/discover/';
    var api_key = 'movie?api_key=' + process.env.API_KEY;
    var options = '&language=en&region=US&include_adult=false' + status.session.genre +'&page=1';
    let url = base_url + api_key + options;

    axios.get(url)
      .then(function (api) {
        select.lastPage = api.data.total_pages - 1;
        if (select.lastPage > 1000) {
          select.lastPage = Math.ceil(Math.random() * 1000);
        } else {
          select.lastPage = api.data.total_pages;
        }
        response.redirect('/game');
      })
});

//logs user highscore into postgreSQL database
app.post('/something', function(request, response, next) {
  var select = new Selector(request.session);
  var status = new Status(request.session);
  select.user = request.body.playerName;
  db.query('INSERT INTO highscores VALUES (default, $1, $2)',[select.user, status.session.score] )
    .then(function() {
      response.redirect('/highscores');
    })
    .catch(next);
});

// checks if the user selected answer is the correct answer
app.post('/guess', function(request, response, next) {
  var select = new Selector(request.session)
  var status = new Status(request.session);
  var answer = request.body.answer;
  var correctAnswer = select.title[select.index];
  if (answer == correctAnswer && status.session.lives > 0) {
    status.Correct();
    response.redirect('/game');
  } else {
    status.Incorrect();
    if (status.session.lives <= 0) {
      response.redirect('/game_over?ts=' + Date.now());
    }
  }
});

//Port 3000 is optional
app.listen(3000, function() {
  console.log('Example app listening on port 3000!')
});
/**
 * @returns Promise that might have genres
 *   success: Contains Axios result with genres
 *   error: Contains error object
 */
function getGenres() {
  let url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.API_KEY}&language=en-US`

  return axios.get(url)
    .then(function(api) {
      return api;
    })
    .catch(function (error) {
      console.error(error);
      return Promise.reject(error);
    });
}
