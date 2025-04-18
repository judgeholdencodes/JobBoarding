const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || '1-yTYFS3IOf5925T1f1Z'
  },
  tls: {
    rejectUnauthorized: false // Bypass self-signed certificate for development
  }
});

module.exports = client;