const express = require('express');
const app = express();
const dotenv = require('dotenv')

const cors = require('cors');
const databaseConnect = require('./config/database')
const authRouter =  require('./routes/authRoute')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const messengerRoute = require('./routes/messengerRoute');

// dotenv.config({
//     path : 'config/config.env'
// })

dotenv.config({path: 'backend/config/config.env'});

app.use(cors({origin: 'http://localhost:4000'}));

console.log(process.env.DATABASE_URL);

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/messenger', authRouter);
app.use('/api/messenger',messengerRoute);

const PORT = 5001

app.get('/', (req, res)=>{
    res.send('This is from backend');
})

databaseConnect();

app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`)
})