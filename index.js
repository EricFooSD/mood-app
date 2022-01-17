/* eslint-disable prefer-destructuring */
/* eslint-disable max-len */
import express, { request, response } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import moment from 'moment';
import pg from 'pg';
import jsSHA from 'jssha';
import multer from 'multer';

// .....................................
// App set up
// .....................................
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('uploads'));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: false }));
moment().format();
const multerUpload = multer({ dest: 'uploads/' });

const { Client } = pg;
const pgConnectionConfigs = {
  user: 'Eric',
  host: 'localhost',
  database: 'moodfulness',
  port: 5432, // Postgres server always runs on this port
};
const client = new Client(pgConnectionConfigs);
client.connect();

// .....................................
// Global Variable
// .....................................

let data = {};

// .....................................
// User Auth
// .....................................

const SALT = 'Eric testing the Hash';

const getHash = (input) => {
  // create new SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  // create an unhashed cookie string based on user ID and salt
  const unhashedString = `${input}-${SALT}`;

  // generate a hashed cookie string using SHA object
  shaObj.update(unhashedString);

  return shaObj.getHash('HEX');
};

app.use((request, response, next) => {
  // set the default value
  request.isUserLoggedIn = false;

  // check to see if the cookies you need exists
  if (request.cookies.loggedInHash && request.cookies.userID) {
    // get the hased value that should be inside the cookie
    const hash = getHash(request.cookies.userID);

    // test the value of the cookie
    if (request.cookies.loggedInHash === hash) {
      request.isUserLoggedIn = true;
    }
  }

  next();
});

const restrictToLoggedIn = (request, response, next) => {
  // is the user logged in? Use the other middleware.
  if (request.isUserLoggedIn === false) {
    response.redirect('/login');
  } else {
    // The user is logged in. Get the user from the DB.
    const userQuery = 'SELECT * FROM users WHERE id=$1';
    client
      .query(userQuery, [request.cookies.userID])
      .then((userQueryResult) => {
        // can't find the user based on their cookie.
        if (userQueryResult.rows.length === 0) {
          response.redirect('/login');
          return;
        }

        // attach the DB query result to the request object.
        request.user = userQueryResult.rows[0];

        // go to the route callback.
        next();
      }).catch((error) => {
        response.redirect('/login');
      });
  }
};

// .....................................
// Functions
// .....................................

const getRandomInt = (max) => Math.floor(Math.random() * max);

const userInfo = (request, response, next) => {
  console.log('get: userInfo');
  data = {};
  const { userID } = request.cookies;
  if (userID == null) {
    data.profile = { photo: 'images/user-circle-solid.svg' };
  }
  else {
    client
      .query(`SELECT * FROM users WHERE id=${userID}`)
      .then((result2) => {
        data.profile = result2.rows[0];
      })
      .catch((error) => console.log(error.stack));
  }
  next();
};

const homePage = (request, response) => {
  console.log('get: homepage');
  const sqlQuery = 'SELECT * FROM quotes';
  client
    .query(sqlQuery)
    .then((result) => {
      const quoteID = getRandomInt(result.rows.length);
      data.id = result.rows[quoteID];
      console.log('data', data);
      response.render('home', data);
    })
    .catch((error) => console.log(error.stack));
};

const statusPage = (request, response) => {
  console.log('get: status page');
  const user = request.cookies.userID;
  console.log('user', user);
  const sqlQuery = `SELECT activity.id, activity.user_id, activity.date, activity_type.name, activity.free_text, activity_type.category, activity.activity_type, activity_type.icon FROM activity INNER JOIN activity_type ON activity.activity_type = activity_type.id WHERE activity.user_id=${user}`;
  client
    .query(sqlQuery)
    .then((result) => {
      const activity = [];
      const selectedSort = request.query.sortby;
      console.log('sort by: ', request.query.sortby);
      result.rows.sort((a, b) => ((b.date > a.date) ? 1 : -1));
      for (let i = 0; i < result.rows.length; i += 1) {
        result.rows[i].mood = [];
        result.rows[i].moodNames = '';
        result.rows[i].dataDate = result.rows[i].date;
        if (selectedSort == null) {
          result.rows[i].date = moment(result.rows[i].date).format('MMM Do YYYY');
          activity.push(result.rows[i]);
        }
        else if (result.rows[i].date === selectedSort) {
          result.rows[i].date = moment(result.rows[i].date).format('MMM Do YYYY');
          activity.push(result.rows[i]);
        }
      }
      data.activity = activity;
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          client
            .query('SELECT * FROM activity_type')
            .then((result3) => {
              data.type = result3.rows;
              client
                .query('SELECT activity_mood.activity_id, activity_mood.mood_id, mood.name FROM activity_mood INNER JOIN mood ON activity_mood.mood_id = mood.id')
                .then((result4) => {
                  // console.log('result4.rows', result4.rows);
                  for (let i = 0; i < result4.rows.length; i += 1) {
                    for (let j = 0; j < data.activity.length; j += 1) {
                      if (data.activity[j].id === result4.rows[i].activity_id) {
                        data.activity[j].moodNames += `${result4.rows[i].name} `;
                        data.activity[j].mood.push(result4.rows[i]);
                        // console.log(`activity.id = ${j}`, data.activity[j].mood);
                        break; }
                    }
                  }
                  console.log('data', data);
                  response.render('status', data);
                });
            });
        });
    })
    .catch((error) => console.log(error.stack));
};

const bodyPage = (request, response) => {
  console.log('get: form body');
  client
    .query('SELECT * FROM activity_type WHERE category = 1')
    .then((result) => {
      data.type = result.rows;
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          client
            .query('SELECT * FROM quotes WHERE type = 1')
            .then((result3) => {
              data.quote = result3.rows[getRandomInt(result3.rows.length)];
              response.render('body', data);
            });
        });
    })
    .catch((error) => console.log(error.stack));
};

const mindPage = (request, response) => {
  console.log('get: form mind');
  client
    .query('SELECT * FROM activity_type WHERE category = 2')
    .then((result) => {
      data.type = result.rows;
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          client
            .query('SELECT * FROM quotes WHERE type = 2')
            .then((result3) => {
              data.quote = result3.rows[getRandomInt(result3.rows.length)];
              response.render('mind', data);
            });
        });
    })
    .catch((error) => console.log(error.stack));
};

const logEntry = (request, reponse) => {
  console.log('post: note submitted');
  console.log(request.body);
  const log = request.body;
  const { userID } = request.cookies;
  let addQuery = '';
  const inputLog = [userID, log.date, log.activity_type, log.free_text];
  client
    .query('INSERT INTO activity (user_id, date, activity_type, free_text) VALUES ($1,$2,$3,$4) RETURNING id', inputLog)
    .then((result) => {
      const { id } = result.rows[0];
      if (Array.isArray(log.mood_id))
      { log.mood_id.forEach((element) => {
        addQuery += `(${id},${element}),`;
      });
      addQuery = addQuery.slice(0, -1); }
      else {
        addQuery = `(${id},${log.mood_id})`;
      }
      console.log('addQuery', addQuery);
      return client.query(`INSERT INTO activity_mood (activity_id, mood_id) VALUES ${addQuery}`);
    })
    .then((result2) => {
      console.log('Submitted');
      reponse.end('Submitted');
    })
    .catch((error) => console.log(error.stack));
};

const deleteEntry = (request, response) => {
  console.log('delete: remove entry');
  const selectedNote = request.params.id;
  console.log('selectedNote', selectedNote);
  const sqlQuery = `DELETE FROM activity WHERE id=${selectedNote}; DELETE FROM activity_mood WHERE activity_id=${selectedNote}`;
  client
    .query(sqlQuery)
    .then((result) => {
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

const editEntry = (request, response) => {
  const selectedNote = request.params.id;
  const edit = request.body;
  console.log(`edit: edit entry ${selectedNote}`);
  console.log('edit', edit);
  console.log('selectedNote', selectedNote);
  let addQuery = '';
  if (Array.isArray(edit.mood_id)) {
    edit.mood_id.forEach((element) => {
      addQuery += `(${selectedNote},${element}),`;
    });
    addQuery = addQuery.slice(0, -1); }
  else {
    addQuery = `(${selectedNote},${edit.mood_id})`;
  }
  const sqlQuery = `UPDATE activity SET date='${edit.date}', activity_type='${edit.activity_type}', free_text='${edit.free_text}' WHERE id=${selectedNote}; DELETE FROM activity_mood WHERE activity_id=${selectedNote}; INSERT INTO activity_mood (activity_id, mood_id) VALUES ${addQuery}`;
  client
    .query(sqlQuery)
    .then((result) => {
      console.log(result.rows);
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

const logInPage = (request, response) => {
  console.log('get: login page');
  console.log('request.isUserLoggedIn', request.isUserLoggedIn);
  data.error = '';
  if (request.isUserLoggedIn === true) {
    response.redirect('/status');
    return;
  }
  response.render('login', data);
};

const createUser = (request, response) => {
  console.log('post: Create User');
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(request.body.password);
  const hashedPassword = shaObj.getHash('HEX');

  const values = [request.body.name, request.body.age, request.body.gender, request.body.password, hashedPassword, request.file.filename];
  const sqlQuery = 'INSERT INTO users (name, age, gender, password, hashed_password, photo) VALUES ($1,$2,$3,$4,$5,$6)';
  client
    .query(sqlQuery, values)
    .then((result) => {
      console.log('Account Created');
      response.redirect('/login');
    })
    .catch((error) => console.log(error.stack));
};

const logIn = (request, response) => {
  console.log('login attempted');
  const values = [request.body.name];
  client
    .query('SELECT * from users WHERE name=$1', values)
    .then((result) => {
      if (result.rows.length === 0) {
        console.log('NO_SUCH_USER');
        data.error = 'NO_SUCH_USER';
        response.render('login', data);
        return;
      }
      const user = result.rows[0];
      console.log('user', user);
      const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      shaObj.update(request.body.password);
      const hashedPassword = shaObj.getHash('HEX');

      if (user.hashed_password !== hashedPassword) {
        console.log('WRONG_PASSWORD');
        data.name = `${request.body.name}`;
        data.error = 'WRONG_PASSWORD';
        console.log('data', data);
        response.render('login', data);
        return;
      }

      const shaObj2 = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      const unhashedCookieString = `${user.id}-${SALT}`;
      shaObj2.update(unhashedCookieString);
      const hashedCookieString = shaObj2.getHash('HEX');
      response.cookie('loggedInHash', hashedCookieString);
      response.cookie('userID', `${user.id}`);
      response.cookie('photo', result.rows[0].photo);
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

const signOut = (request, response) => {
  console.log('signout', response.cookies);
  response.clearCookie('userID');
  response.clearCookie('loggedInHash');
  response.redirect('/login');
};

const chartPage = (request, response) => {
  console.log('get: homepage');
  const sqlQuery = 'SELECT * FROM quotes';
  client
    .query(sqlQuery)
    .then((result) => {
      const quoteID = getRandomInt(result.rows.length);
      data.id = result.rows[quoteID];
      console.log('data', data);
      response.render('chart', data);
    })
    .catch((error) => console.log(error.stack));
};

// .....................................
// Routes
// .....................................

// get
app.get('/', userInfo, homePage);
app.get('/status', restrictToLoggedIn, userInfo, statusPage);
app.get('/body', restrictToLoggedIn, userInfo, bodyPage);
app.get('/mind', restrictToLoggedIn, userInfo, mindPage);
app.get('/login', userInfo, logInPage);
app.get('/signout', restrictToLoggedIn, userInfo, signOut);
app.get('/chart', restrictToLoggedIn, userInfo, chartPage);

// post
app.post('/logEntry', restrictToLoggedIn, logEntry);
app.post('/edit/:id', restrictToLoggedIn, editEntry);
app.post('/createAccount', multerUpload.single('photo'), createUser);
app.post('/logIn', logIn);

// delete
app.delete('/delete/:id', restrictToLoggedIn, deleteEntry);

app.listen(3004);
