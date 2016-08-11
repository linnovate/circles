'use strict';

module.exports = {
  db: 'mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || 'localhost') + '/circles-dev',
  google: {
    client_id: 'client_id',
    client_secret: 'client_secret',
    redirect_uri: 'redirect_uri',
  }
};