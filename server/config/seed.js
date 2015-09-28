/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Stock = require('../api/stock/stock.model');

Stock.find({}).remove(function() {
  Stock.create({
    name : 'AAPL'
  }, {
    name : 'MSFT'
  }, {
    name : 'GOOG'
  });
});