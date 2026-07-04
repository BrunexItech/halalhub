require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/mpesa', require('./src/routes/mpesa'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'HalalHub API is running' });
});

app.listen(PORT, () => {
  console.log(`🕋 HalalHub API running on port ${PORT}`);
});
