/**
 * Created by qqtech on 2015/4/17.
 * Log Level 说明
 *   ALL: new Level(Number.MIN_VALUE, "ALL"),
 *   TRACE: new Level(5000, "TRACE"),
 *   DEBUG: new Level(10000, "DEBUG"),
 *   INFO: new Level(20000, "INFO"),
 *   WARN: new Level(30000, "WARN"),
 *   ERROR: new Level(40000, "ERROR"),
 *   FATAL: new Level(50000, "FATAL"),
 *   MARK: new Level(9007199254740992, "MARK"), // 2^53
 *   OFF: new Level(Number.MAX_VALUE, "OFF"),
 */

var log = require('log4js');

var log4js = function(name){
//日志配置
    log.configure({
        appenders: [
            {
                type: 'console'
            },
            {
                type: 'dateFile',
                filename: 'logs/fs_esl.log',
                pattern: "-yyyy-MM-dd.bak",
                maxLogSize: 51200,
                alwaysIncludePattern: false,
                backups: 60,
                category: 'logger'
            }
        ],
        replaceConsole: true
    });
    this.logger = log.getLogger(name);
    this.logger.setLevel('TRACE');
}


log4js.prototype.getLogger = function(){
    var sef = this;
    return sef.logger;
};

exports.getLogger = function(){
    var log = new log4js('logger');
    return log.getLogger();
}