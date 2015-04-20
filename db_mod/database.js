/**
 * Created by grassman on 14-3-19.
 */
var MySQL = require("./mysqldb").MySQL;
var config = require('../config.json');

var db = null;

function getDataBase(){
    if(db == null)
        db = new MySQL(config.mysql);

    return db;
}

exports.getDB = getDataBase;

