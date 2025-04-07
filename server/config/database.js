require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mental_health_db',
    host: process.env.DB_HOST || 'mysql',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: console.log,
    dialectOptions: {
      ssl: false
    }
  },
  test: {
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: (process.env.DB_NAME ? process.env.DB_NAME + '_test' : 'mental_health_db_test'),
    host: process.env.DB_HOST || 'mysql',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      ssl: false
    }
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'mysql',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
}; 