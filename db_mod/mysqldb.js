/**
 * Created by grassman on 14-3-19.
 */
var mysql = require("mysql");
var logger = require("../logger").getLogger('MySQL');

var MySQL = exports.MySQL = function(opt){
    this.opt = opt || {
        host     : '127.0.0.1',
        port     : 3306,
        user     : 'root',
        password : '000000'
    };
    this.connect();
}

MySQL.prototype.connect = function (cb) {
    this.connection = mysql.createConnection(this.opt);
    this.connection.on('error',function(err){
        logger.error('onListener error code =' + err.code);
    });
    this.connection.connect(function(err) {
        if (err) {
            logger.error('error connecting: ' + err.stack);
            return;
        }

        logger.info('mysql connected success! ');
        if(cb)
            cb();
    });
}

MySQL.prototype.query = function (sql,cb) {
    logger.info(sql);
    var self = this;
    this.connection.query(sql, function(err, rows, fields) {
        if (err) {
            logger.error('query error code =' + err.code);
            logger.error('query error fatal=' + err.fatal);
            self.connect(function(){
                self.query(sql,cb);
            });
            return;
        }
        if(cb)
            cb(rows,fields);
    });
}

MySQL.prototype.close = function () {
    this.connection.end(function(err) {
        // The connection is terminated now
        if (err) {
            logger.error('error end: ' + err);
            return;
        }
    });
};

