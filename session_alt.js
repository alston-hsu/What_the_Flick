class Selector {
  constructor(session, resetTitles){
    this.session = session;
    session.prevMovies = session.prevMovies || [0];

    if (session.prevMovies.length >= 50) {
      session.prevMovies = [];
    }

    if (resetTitles) {
      session.title = [];
    }

    this.prevMovies = session.prevMovies;
    this.movie = [];
    this.page = 0;
    this.index = session.index || 0;
    this.title = session.title;
    this.image = [];
    this.hint = [];
    this.choices = [];
  }

  get lastPage() {
    this.session.lastPage = this.session.lastPage || 1;
    return this.session.lastPage;
  }

  set lastPage(value) {
    this.session.lastPage = value;
  }

  SaveMovie() {
    this.prevMovies.push(this.movie);
  }
  Movie() {
    this.page = Math.ceil(Math.random() * this.lastPage);
    this.index = Math.floor(Math.random() * 20);
    this.movie = this.page + (this.index/100);
    for(var i = 0; i < this.prevMovies.length;i++) {
      if (this.movie === this.prevMovies[i]) {
        this.Movie();
        break;
      }
    }
    this.SaveMovie();
  }
  MovieData(api) {
    for(var j=0; j<20; j++) {
      if (api.data.results[j].backdrop_path) {
        this.image.push(api.data.results[j].backdrop_path);
        this.title.push(api.data.results[j].title);
        this.hint.push(api.data.results[j].overview);
      }
    }
    // checks to make sure img_url isn't empty if so gets new api call
    if(this.image.length < 5) {
        response.redirect('/game');
    }
    // replace page[1] choice if arrays less that 20
    if (this.title.length < 20) {
    ////need to refactor page from wtf.js
      this.index = (Math.floor(Math.random()*this.title.length));
    }
    this.choices = this.GenerateChoices();
    //packages movie data into context for the front-end.
    var context = {
        imgUrl: 'https://image.tmdb.org/t/p/w500/' + this.image[this.index],
        title: this.title[this.index],
        overviewHint: this.hint[this.index],
        choice: this.choices,
        score: null,
        lives: null,
    }
    this.session.index = this.index;
    return context;
  }
  // creates the multiple choices
  GenerateChoices () {
    var choices = [];

    while (true) {
      let tmpRnd = Math.floor(Math.random() * this.title.length)
      let t = this.title[tmpRnd];
      if (choices.indexOf(t) == -1) {
        choices.push(t);
      }
      if (choices.length == 4) {
        break;
      }
    }
    // replace random answer with correct answer if not present in choices
    if (!choices.includes(this.title[this.index])) {
      let replace = Math.floor(Math.random() * choices.length);
      choices[replace] = this.title[this.index];
    }
    return choices;
  }
}

module.exports = Selector;
