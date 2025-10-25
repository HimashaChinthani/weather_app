require('dotenv').config();
const express = require('express');
const cors = require('cors');
const weatherRouter = require('./routes/weather');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/weather', weatherRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
