/**
 * Created by qqtech on 2015/4/14.
 */
var mod_esl = require('modesl');
var conn = null;
function run()
{
    conn = new mod_esl.Connection('192.168.1.38', 8021, 'ClueCon', function() {
        console.log('fs connect success!');
    });
}

exports.getConn = function(){
    return conn;
};

exports.run = run;