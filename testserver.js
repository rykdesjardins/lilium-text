const express = require('express');
const app = express();

app.set('port', 3000);
app.use(express.static('dev'));
app.listen(app.get('port'));
