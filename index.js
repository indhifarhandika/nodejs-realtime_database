const express = require('express');
const bodyParser = require('body-parser');
const Pusher = require('pusher');
const pg = require('pg');

require('dotenv').config();

const app = express();

let pgClient;

app.set('view engine', 'ejs');

const pool = new pg.Pool({
    connectionString: process.env.POSTGRES_CONNECTION_URL,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    encrypted: true
});

pool.connect((err, client) => {
    if(err) {
        console.log(err);
      }
      pgClient = client;
      console.log("SUKSES");
      client.on('notification', function(msg) {
        console.log("MESSAGE >>>>> ",msg)
        if(msg.channel === 'watch_outbox'){
            pusher.trigger('watch_outbox', 'new_record', JSON.parse(msg.payload));
        }else if(msg.channel === 'del_outbox'){
            pusher.trigger('del_outbox', 'remove_record', JSON.parse(msg.payload));
        }else if(msg.channel === 'watch_sentitems'){
            pusher.trigger('watch_sentitems', 'new_record_sentitems', JSON.parse(msg.payload));
        }
      });
      client.query('LISTEN watch_sentitems');
      client.query('LISTEN watch_outbox');
      client.query('LISTEN del_outbox');
});

app.listen(3000, () => {
    return console.log('Server is up on 3000')
});


// route
app.get('/outbox', async(req, res) => {
    const data = await pgClient.query('SELECT * FROM outbox');
    console.log(req);
    return res.render('index', {table: data.rows, judul: 'Outbox'});
});

app.get('/sentitems', async(req, res) => {
    const data = await pgClient.query('SELECT * FROM public.sentitems ORDER BY "ID" DESC, "SequencePosition" ASC LIMIT 100');
    console.log(req);
    return res.render('sentitems', {table: data.rows, judul: 'Sent Items'});
});