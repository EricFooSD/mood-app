/* eslint-disable max-len */
import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import moment from 'moment';
import pg from 'pg';
import jsSHA from 'jssha';

const { Pool } = pg;

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
  database: 'birds',
  port: 5432, // Postgres server always runs on this port
};
const pool = new Pool(pgConnectionConfigs);

const SALT = 'Eric testing the Hash';