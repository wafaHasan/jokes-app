'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const pg = require('pg');
const superagent = require('superagent');
const cors = require('cors');
const methodOverride = require('method-override');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);
let PORT = process.env.PORT || 4000;

// (number, type,setup,punchline)
app.get('/home', (req, res) => {
    let url = 'https://official-joke-api.appspot.com/random_ten';
    superagent.get(url)
        .then(result => {

            let jokesresult = result.body.map(result => {
                return new Joke(result);
            });
            res.render('home', { data: jokesresult });
        });
});

app.post('/save', (req, res) => {
    let sql = 'insert into jokes (number, type,setup,punchline) values ($1,$2,$3,$4) returning *;';
    let { number, type, setup, punchline } = req.body;
    let safeVals = [number, type, setup, punchline];
    client.query(sql, safeVals)
        .then(() => {
            res.redirect('/favjokes');
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});

app.get('/favjokes', (req, res) => {
    let sql = 'select * from jokes';
    client.query(sql)
        .then(result => {
            res.render('favjokes', { data: result.rows });
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});

app.get('/details/:id', (req, res) => {
    let sql = 'select * from jokes where id =$1;';
    let safeVal = [req.params.id];
    client.query(sql, safeVal)
        .then((result => {
            res.render('details', { data: result.rows });
        }))
        .catch(err => {
            res.render('err', { err: err });
        });
});

// (number, type,setup,punchline)

app.put('/update/:id', (req, res) => {
    let sql = 'update jokes set number=$1,type=$2,setup=$3,punchline=$4 where id =$5; ';
    let { number, type, setup, punchline } = req.body;
    let safeVals = [number, type, setup, punchline, req.params.id];
    client.query(sql, safeVals)
        .then((result) => {
            res.redirect(`/details/${req.params.id}`);
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});

app.delete('/delete/:id', (req, res) => {
    let sql = 'delete from jokes where id=$1;';
    let safeVals = [req.params.id];
    client.query(sql, safeVals)
        .then(() => {
            res.redirect(`/favjokes`);
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});


function Joke(data) {
    this.number = data.id;
    this.type = data.type;
    this.setup = data.setup;
    this.punchline = data.punchline;
}

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`up to ${PORT}`);
        });
    });
