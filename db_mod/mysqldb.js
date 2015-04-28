/**
 * Created by grassman on 14-3-19.
 */
var mysql = require("mysql");
var logger = require("../logger").getLogger();

var MySQL = exports.MySQL = function(opt){
    opt = opt || {
        host     : '127.0.0.1',
        port     : 3306,
        user     : 'root',
        password : '000000'
    };
    this.connection = mysql.createConnection(opt);
    this.connection.connect(function(err) {
        if (err) {
            logger.error('error connecting: ' + err.stack);
            return;
        }

        logger.info('mysql connected success! ');
    });
}

MySQL.prototype.query = function (sql,cb) {
    this.connection.query(sql, function(err, rows, fields) {
        if (err) {
            logger.error('error query: ' + err);
            return;
        }

        if(cb)
            cb(rows,fields);
    });
},

    MySQL.prototype.close = function () {
    this.connection.end(function(err) {
        // The connection is terminated now
        if (err) {
            logger.error('error end: ' + err);
            return;
        }
    });
}

