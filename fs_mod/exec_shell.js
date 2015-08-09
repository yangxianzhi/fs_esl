/**
 * Created by yangxz on 15-6-12.
 */

var shell_process = require('child_process');
var logger = require("../logger").getLogger('exec_shell','INFO');

exports.exec_cmd = function(cmd,cb){
    shell_process.exec(cmd, function (error, stdout, stderr){
        if(error)
            logger.error(error.message);

        if(cb)
            cb(error,stdout,stderr);
    });
}