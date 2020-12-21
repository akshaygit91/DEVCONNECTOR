const  express = require('express');

const app = express();

app.get('/', (req, res)=> res.send('v1 Api is up and running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>console.log(`App is running on ${PORT}`));