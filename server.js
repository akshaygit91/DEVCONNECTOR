const  express = require('express');
const connectDb = require('./config/db');


const app = express();

//connect to db
connectDb();

//init middleware
app.use(express.json({extended:false}));

app.get('/', (req, res)=> res.send('Api is up and running'));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profiles', require('./routes/api/profiles'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>console.log(`App is running on ${PORT}`));