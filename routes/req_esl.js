/**
 * Created by qqtech on 2015/4/14.
 */
var FS_API = require('../fs_mod/fs_app').FS_API;
var fs_app = new FS_API();

exports.directory = function(req,res) {
    fs_app.parse_directory(req,res);
}


exports.dialplan = function(req,res) {
    fs_app.parse_dialplan(req,res);
}
