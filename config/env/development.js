'use strict';

module.exports = {
  db: 'mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || 'localhost') + '/circles-dev',
  secret: 'SOME_TOKEN_SECRET',
  api: {
  	uri: 'http://localhost:8888'
  },
  redis: 'redis://127.0.0.1:6379',
  elastic: {
  	host: 'localhost',
  	port: '9200'
  }
};
