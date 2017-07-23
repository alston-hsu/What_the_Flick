# What The Flick?!
This project is a group project made during a DigitalCrafts bootcamp by Paul Como,
Alston Hsu, JJ Spetseris, and George Danforth. It is a game that tests your movie
knowledge.

### Built-with
HTML, LESS, JavaScript, Postgres, Node.js, Express, HBS Framework, and Kube Framework


![Our Website](/webapp.png)

Live @ [www.whattheflick.info](http://www.whattheflick.info)

### Overview
This web app is a game that pulls movie posters from themoviedb.org. The user must
choose the correct title of the movie, from 4 multiple options. Three hint clicks are available and each correct answer adds a point. The game continues until the
user gets a movie incorrect. The game is mobile responsive as well.

### Instructions
Run with `npm run start`.

### Challenges Solved
**Understanding Sessions:** We originally wrote our backend with many global variables.
We knew this would have to change and that sessions were the solution, but we didn't
have experience implementing anything but basic login credentials. For our game we
felt forcing users to log in before playing was overly cumbersome. We solved this by
having multiple session variables in multiple functions that can be called to reset
at different points in the game. For example the player score should only reset on
new games, but the array storing movie titles should reset on each question.

**Working with Kube:** We used Kube as our front-end framework just to try out something new.
However we ran into a problem with it's default button styling. We didn't like it and
it was hard to change the defaults. Instead of going back to a more familiar framework
like Bootstrap, we ended up solving the problem with our own custom classes and ids.

**API calls:** Our team had a varied experience with API calls. Some were comfortable
using older modules and callbacks, but we ended up using Axios with promises. For a time
we had code dependent on multiple calls firing at once. We solved this using Axios's
.all and .spread prototypes. Later this got deprecated when the various API calls
got moved to different routes and one other was removed with a buggy deleted feature.

### Major Contributors
[Paul Como](https://github.com/pcomo24),
[George Danforth](https://github.com/SpectreiiI),
[Alston Hsu](https://github.com/alston-hsu),
[JJ Spetseris](https://github.com/jjspetz)
