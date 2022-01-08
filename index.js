/* eslint-disable max-len */
import express, { request, response } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import moment from 'moment';
import pg from 'pg';
import jsSHA from 'jssha';

const { Client } = pg;

moment().format();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: false }));

const pgConnectionConfigs = {
  user: 'Eric',
  host: 'localhost',
  database: 'moodfulness',
  port: 5432, // Postgres server always runs on this port
};
const client = new Client(pgConnectionConfigs);
client.connect();

const SALT = 'Eric testing the Hash';

const homepage = (request, response) => {
  console.log('get: homepage');
  response.render('home');
};

const statusPage = (request, response) => {
  console.log('get: status page');
  const sqlQuery = 'SELECT activity.id, activity.date, activity_type.name, activity.free_text, activity_type.category FROM activity INNER JOIN activity_type ON activity.activity_type = activity_type.id';
  client
    .query(sqlQuery)
    .then((result) => {
      const activity = result.rows;
      const selectedSort = request.query.sortby;
      console.log('sort by: ', request.query.sortby);
      if (selectedSort === 'date') {
        activity.sort((a, b) => ((a.date > b.date) ? 1 : -1));
      }
      for (let i = 0; i < activity.length; i += 1) {
        activity[i].date = moment(activity[i].date).format('MMM Do YYYY');
      }
      const data = { activity };
      console.log('data', data);
      response.render('status', data);
    })
    .catch((error) => console.log(error.stack));
};

const bodyPage = (request, response) => {
  console.log('get: form body');
  let data;
  client
    .query('SELECT * FROM activity_type WHERE category = 1')
    .then((result) => {
      data = { type: result.rows };
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          response.render('body', data);
        });
    })
    .catch((error) => console.log(error.stack));
};

const mindPage = (request, response) => {
  console.log('get: form mind');
  let data;
  client
    .query('SELECT * FROM activity_type WHERE category = 2')
    .then((result) => {
      data = { type: result.rows };
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          response.render('mind', data);
        });
    })
    .catch((error) => console.log(error.stack));
};

const logEntry = (request, reponse) => {
  console.log('post: note submitted');
  console.log(request.body);
  const data = request.body;
  const userID = 1;
  let addQuery = '';
  const inputData = [userID, data.date, data.activity_type, data.free_text];
  client
    .query('INSERT INTO activity (user_id, date, activity_type, free_text) VALUES ($1,$2,$3,$4) RETURNING id', inputData)
    .then((result) => {
      const { id } = result.rows[0];
      if (Array.isArray(data.mood_id))
      { data.mood_id.forEach((element) => {
        addQuery += `(${id},${element}),`;
      });
      addQuery = addQuery.slice(0, -1); }
      else {
        addQuery = `(${id},${data.mood_id})`;
      }
      console.log('addQuery', addQuery);
      return client.query(`INSERT INTO activity_mood (activity_id, mood_id) VALUES ${addQuery}`);
    })
    .then((result2) => {
      console.log('Submitted Mind');
      reponse.end('Submitted Mind');
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
      console.log(result.rows);
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

const editPage = (request, response) => {
  console.log('get: edit page');
  const selectedNote = request.params.id;
  const sqlQuery = `SELECT activity.id, activity.date, activity.activity_type, activity.free_text FROM activity WHERE activity.id=${selectedNote}`;
  let data;
  client
    .query(sqlQuery)
    .then((result) => {
      data = { activity: result.rows };
      client
        .query('SELECT * FROM mood')
        .then((result2) => {
          data.mood = result2.rows;
          let type = 1;
          if (data.activity[0].activity_type >= 6) {
            type = 2;
          }
          console.log('data.activity[0].activity_type', data.activity.activity_type);
          client
            .query(`SELECT * FROM activity_type WHERE category = ${type}`)
            .then((result3) => {
              data.type = result3.rows;
              console.log('data', data);
              response.render('edit', data);
            });
        });
    })
    .catch((error) => console.log(error.stack));
};

const editEntry = (request, response) => {
  console.log('delete: remove entry');
  const selectedNote = request.params.id;
  console.log('selectedNote', selectedNote);
  const sqlQuery = `DELETE FROM activity WHERE id=${selectedNote}; DELETE FROM activity_mood WHERE activity_id=${selectedNote}`;
  client
    .query(sqlQuery)
    .then((result) => {
      console.log(result.rows);
      response.redirect('/status');
    })
    .catch((error) => console.log(error.stack));
};

app.get('/', homepage);
app.get('/status', statusPage);
app.get('/body', bodyPage);
app.get('/mind', mindPage);
app.post('/logEntry', logEntry);
app.delete('/delete/:id', deleteEntry);
app.get('/edit/:id', editPage);

app.listen(3004);
