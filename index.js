/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable max-len */
import express, { request, response } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import moment from 'moment';
import pg from 'pg';
import jsSHA from 'jssha';
import multer from 'multer';
import aws from 'aws-sdk';
import multerS3 from 'multer-s3';

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

// .... set up AWS s3 bucket for file storage .... //
const s3 = new aws.S3({
  accessKeyId: process.env.ACCESSKEYID,
  secretAccessKey: process.env.SECRETACCESSKEY,
});

let multerUpload = multer({ dest: 'uploads/' });

// .... connection to DB and uploads .... //
const { Client } = pg;
let pgConnectionConfigs;
if (process.env.DATABASE_URL) {
  // pg will take in the entire value and use it to connect
  pgConnectionConfigs = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  };

  multerUpload = multer({
    storage: multerS3({
      s3,
      bucket: 'moodbucket',
      acl: 'public-read',
      metadata: (request, file, callback) => {
        callback(null, { fieldname: file.fieldname });
      },
      key: (request, file, callback) => {
        callback(null, Date.now().toString());
      },
    }),
  });
} else {
  // this is the same value as before
  pgConnectionConfigs = {
    user: 'Eric',
    host: 'localhost',
    database: 'moodfulness',
    port: 5432, // Postgres server always runs on this port
  };
}

const client = new Client(pgConnectionConfigs);
client.connect();

const PORT = process.env.PORT || 3004;

// .....................................
// User Auth
// .....................................

const SALT = 'Eric testing the Hash';

// .... function to hash a string .... //
const getHash = (input) => {
  // create new SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  // create an unhashed cookie string based on user ID and salt
  const unhashedString = `${input}-${SALT}`;

  // generate a hashed cookie string using SHA object
  shaObj.update(unhashedString);

  return shaObj.getHash('HEX');
};

// .... express middleware to get current user data .... //
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

// .... function to be used to check user credentials before allowing other CRUD calls .... //
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
// Helper Functions
// .....................................

const getRandomInt = (max) => Math.floor(Math.random() * max);

// .... function to get user info like name, profile picture .... //
const getUserInfo = (cookies, data) => {
  console.log('get: userInfo');
  const { userID } = cookies;
  let profile;
  if (userID == null) {
    profile = { photo: 'user-circle-solid.svg' };
    data.profile = profile;
  }
  else {
    client
      .query(`SELECT * FROM users WHERE id=${userID}`)
      .then((result) => {
        data.profile = result.rows[0];
      })
      .catch((error) => console.log(error.stack));
  }
};

// .....................................
// GET functions
// .....................................

// .... get homepage .... //
const homePage = (request, response) => {
  console.log('get: homepage');
  const data = {};
  getUserInfo(request.cookies, data);
  // query DB for quotes
  const sqlQuery = 'SELECT * FROM quotes';
  client
    .query(sqlQuery)
    .then((result) => {
      const quoteID = getRandomInt(result.rows.length);
      data.id = result.rows[quoteID];
      response.render('home', data);
    })
    .catch((error) => console.log(error.stack));
};

// .... get status / your activities page .... //
const statusPage = (request, response) => {
  console.log('get: status page');
  const data = {};
  // call function to get logged in user info
  getUserInfo(request.cookies, data);
  const user = request.cookies.userID;
  // query DB for the activities logged for particular user.
  const sqlQuery = `SELECT activity.id, activity.user_id, activity.date, activity_type.name, activity.free_text, activity_type.category, activity.activity_type, activity_type.icon FROM activity INNER JOIN activity_type ON activity.activity_type = activity_type.id WHERE activity.user_id=${user}`;
  client
    .query(sqlQuery)
    .then((result) => {
      const activity = [];
      // set the user sort parameter
      const selectedSort = request.query.sortby;
      // default will be sorted from latest to oldest
      result.rows.sort((a, b) => ((b.date > a.date) ? 1 : -1));
      for (let i = 0; i < result.rows.length; i += 1) {
        result.rows[i].mood = [];
        result.rows[i].moodNames = '';
        result.rows[i].dataDate = result.rows[i].date;
        // user did not input a sort parameter
        if (selectedSort == null) {
          // incorporate moment library
          result.rows[i].date = moment(result.rows[i].date).format('Do MMM YYYY');
          activity.push(result.rows[i]);
        }
        // user has selected a sort parameter
        else if (result.rows[i].date === selectedSort) {
          result.rows[i].date = moment(result.rows[i].date).format('Do MMM YYYY');
          activity.push(result.rows[i]);
        }
      }
      data.activity = activity;
      // get all possible mood types - to be used in edit form
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          // get all possible activity types - to be used in edit form
          client
            .query('SELECT * FROM activity_type')
            .then((result3) => {
              data.type = result3.rows;
              // query DB for mood_id for each user activity
              client
                .query('SELECT activity_mood.activity_id, activity_mood.mood_id, mood.name FROM activity_mood INNER JOIN mood ON activity_mood.mood_id = mood.id')
                .then((result4) => {
                  // pair the mood_ids to mood names and insert into main activity data set
                  for (let i = 0; i < result4.rows.length; i += 1) {
                    for (let j = 0; j < data.activity.length; j += 1) {
                      if (data.activity[j].id === result4.rows[i].activity_id) {
                        data.activity[j].moodNames += `${result4.rows[i].name} `;
                        data.activity[j].mood.push(result4.rows[i]);
                        break; }
                    }
                  }
                  response.render('status', data);
                });
            });
        });
    })
    .catch((error) => console.log(error.stack));
};

// .... get page to log physical activity .... //
const bodyPage = (request, response) => {
  console.log('get: log body page');
  const data = {};
  // call function to get logged in user info
  getUserInfo(request.cookies, data);
  // query DB for all body activiy types which are denoted as 1
  client
    .query('SELECT * FROM activity_type WHERE category = 1')
    .then((result) => {
      data.type = result.rows;
      // query DB for all mood types
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          // query DB for fitness quotes
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

// .... get page to log mental activity .... //
const mindPage = (request, response) => {
  console.log('get: log mind page');
  const data = {};
  // call function to get logged in user info
  getUserInfo(request.cookies, data);
  // query DB for all mental activiy types which are denoted as 2
  client
    .query('SELECT * FROM activity_type WHERE category = 2')
    .then((result) => {
      data.type = result.rows;
      // query DB for all mood types
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          // query DB for mental wellness quotes
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

// .... get login page .... //
const logInPage = (request, response) => {
  console.log('get: login page');
  const data = {};
  // get user info
  getUserInfo(request.cookies, data);
  data.error = '';
  // if user is already logged in, redirect to status page
  if (request.isUserLoggedIn === true) {
    response.redirect('/status');
    return;
  }
  response.render('login', data);
};

// .... get chart page .... //
const chartPage = (request, response) => {
  console.log('get: chart');
  const data = {};
  // get user info
  getUserInfo(request.cookies, data);

  const user = request.cookies.userID;

  // set parameter for sort date
  const selectedSort = request.query.sortby;

  let startDate;

  // if no sort date selected, default to T -7 days
  if (selectedSort == null) {
    startDate = moment().subtract(7, 'day');
  } else {
    startDate = moment(selectedSort);
  }
  console.log('startDate', startDate);

  // function to get all the dates for 1 week from selected sort date
  const weekly = (date) => {
    const dates = [];
    for (let i = 0; i < 7; i += 1) {
      const newDate = (moment(date).add(i, 'day'));
      dates.push(moment(newDate).format('MMM Do'));
    }
    return dates;
  };

  const selectedDates = weekly(startDate);
  // set data lables for x-axis in chart
  data.labels = selectedDates;

  // quote DB for all activities of user
  client
    .query(`SELECT activity.id, activity.user_id, activity.date, activity.activity_type, activity_type.name FROM activity INNER JOIN activity_type ON activity.activity_type = activity_type.id WHERE user_id=${user}`)
    .then((result) => {
      result.rows.sort((a, b) => ((a.date > b.date) ? 1 : -1));
      data.activity = result.rows;
      data.activity.forEach((element) => {
        element.chartDate = moment(element.date).format('MMM Do');
        element.score = 0;
      });
      // get all mood ratings for each activity that was retreived
      client
        .query('SELECT activity_mood.activity_id, activity_mood.mood_id, mood.rating FROM activity_mood INNER JOIN mood ON activity_mood.mood_id = mood.id')
        .then((result2) => {
          result2.rows.forEach((element) => {
            // iterate through activities and add the combined mood rating scores
            for (let j = 0; j < data.activity.length; j += 1) {
              if (element.activity_id === data.activity[j].id) { data.activity[j].score += element.rating;
                break;
              }
            }
          });
          // get all activity types from DB
          client
            .query('SELECT * FROM activity_type')
            .then((result3) => {
              // for each activity type, add the corresponding mood rating scores
              result3.rows.forEach((element) => {
                data[`${element.name}`] = [0, 0, 0, 0, 0, 0, 0];

                for (let j = 0; j < data.labels.length; j += 1) {
                  for (let k = 0; k < data.activity.length; k += 1) {
                    if (data.activity[k].chartDate === data.labels[j] && data.activity[k].name === element.name) {
                      data[`${element.name}`][j] += data.activity[k].score;
                    }
                  }
                }
              });
              response.render('chart', data);
            });
        });
    })
    .catch((error) => console.log(error.stack));
};

// .... get user profile page .... //
const profilePage = (request, response) => {
  console.log('get: profile page');
  const data = {};
  // get user data
  getUserInfo(request.cookies, data);

  const sqlQuery = 'SELECT * FROM quotes';
  client
    .query(sqlQuery)
    .then((result) => {
      const quoteID = getRandomInt(result.rows.length);
      data.id = result.rows[quoteID];
      console.log('data', data);
      response.render('profile', data);
    })
    .catch((error) => console.log(error.stack));
};

// .....................................
// POST functions
// .....................................

// .... posting a new activity entry into DB .... //
const logEntry = (request, response) => {
  console.log('post: new entry submitted');

  const log = request.body;
  const { userID } = request.cookies;
  let addQuery = '';
  const inputLog = [userID, log.date, log.activity_type, log.free_text];
  // add activity in to activities table
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
      // add mood ids into activity_mood M-M table
      return client.query(`INSERT INTO activity_mood (activity_id, mood_id) VALUES ${addQuery}`);
    })
    .then((result2) => {
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

// .... deleting activity in DB .... //
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

// .... edit activity in DB .... //
const editEntry = (request, response) => {
  const selectedNote = request.params.id;
  const edit = request.body;
  let addQuery = '';
  // if multiple moods selected for 1 activity update addQuery string
  if (Array.isArray(edit.mood_id)) {
    edit.mood_id.forEach((element) => {
      addQuery += `(${selectedNote},${element}),`;
    });
    addQuery = addQuery.slice(0, -1); }
  // if only 1 mood selected, addQuery will just be 1 entry
  else {
    addQuery = `(${selectedNote},${edit.mood_id})`;
  }
  // update activity DB with new information. delete all old entries in activity_mood table and add new moods
  const sqlQuery = `UPDATE activity SET date='${edit.date}', activity_type='${edit.activity_type}', free_text='${edit.free_text}' WHERE id=${selectedNote}; DELETE FROM activity_mood WHERE activity_id=${selectedNote}; INSERT INTO activity_mood (activity_id, mood_id) VALUES ${addQuery}`;
  client
    .query(sqlQuery)
    .then((result) => {
      console.log(result.rows);
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

// .... create a new user .... //
const createUser = (request, response) => {
  const data = {};
  getUserInfo(request.cookies, data);
  console.log('post: Create User');
  // hash users password
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(request.body.password);
  const hashedPassword = shaObj.getHash('HEX');

  const values = [request.body.name, request.body.age, request.body.gender, request.body.password, hashedPassword, request.file.key];
  const sqlQuery = 'INSERT INTO users (name, age, gender, password, hashed_password, photo) VALUES ($1,$2,$3,$4,$5,$6)';
  client
    .query(sqlQuery, values)
    .then((result) => {
      console.log('Account Created');
      response.redirect('/login');
    })
    .catch((error) => console.log(error.stack));
};

// .... attempt login .... //
const logIn = (request, response) => {
  console.log('login attempted');
  const data = {};
  getUserInfo(request.cookies, data);
  const values = [request.body.name];
  client
    .query('SELECT * from users WHERE name=$1', values)
    .then((result) => {
      // pass serve side validation error code for display in frontend
      if (result.rows.length === 0) {
        data.error = 'NO_SUCH_USER';
        response.render('login', data);
        return;
      }
      const user = result.rows[0];
      const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      shaObj.update(request.body.password);
      const hashedPassword = shaObj.getHash('HEX');

      // check password with DB
      if (user.hashed_password !== hashedPassword) {
        console.log('WRONG_PASSWORD');
        data.name = `${request.body.name}`;
        data.error = 'WRONG_PASSWORD';
        console.log('data', data);
        response.render('login', data);
        return;
      }

      // if password matches, insert cookies
      const shaObj2 = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      const unhashedCookieString = `${user.id}-${SALT}`;
      shaObj2.update(unhashedCookieString);
      const hashedCookieString = shaObj2.getHash('HEX');
      response.cookie('loggedInHash', hashedCookieString);
      response.cookie('userID', `${user.id}`);
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

// .... log out .... //
const signOut = (request, response) => {
  console.log('signout');
  response.clearCookie('userID');
  response.clearCookie('loggedInHash');
  response.redirect('/login');
};

// .... editting profile .... //
const editProfile = (request, response) => {
  const edit = request.body;
  console.log('edit user profile');

  // hash new password
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(edit.password);
  const hashedPassword = shaObj.getHash('HEX');

  const sqlQuery = `UPDATE users SET name='${edit.name}', age='${edit.age}', gender='${edit.gender}', password='${edit.password}', hashed_password='${hashedPassword}', photo='${request.file.key}' WHERE id=${edit.id}`;
  client
    .query(sqlQuery)
    .then((result) => {
      console.log(result.rows);
      response.redirect('/profile');
    })
    .catch((error) => console.log(error.stack));
};

// .....................................
// Routes
// .....................................

// get
app.get('/', homePage);
app.get('/status', restrictToLoggedIn, statusPage);
app.get('/body', restrictToLoggedIn, bodyPage);
app.get('/mind', restrictToLoggedIn, mindPage);
app.get('/login', logInPage);
app.get('/signout', restrictToLoggedIn, signOut);
app.get('/profile', restrictToLoggedIn, profilePage);
app.get('/chart', restrictToLoggedIn, chartPage);

// post
app.post('/logEntry', restrictToLoggedIn, logEntry);
app.post('/edit/:id', restrictToLoggedIn, editEntry);
app.post('/editProfile', restrictToLoggedIn, multerUpload.single('photo'), editProfile);
app.post('/createAccount', multerUpload.single('photo'), createUser);
app.post('/logIn', logIn);

// delete
app.delete('/delete/:id', restrictToLoggedIn, deleteEntry);

app.listen(PORT);
