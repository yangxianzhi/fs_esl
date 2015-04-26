/**
 * Created by qqtech on 2015/4/14.
 */
var url = require('url');

function parse_cmd(res,req)
{
    var strURL = url.parse(req.originalUrl).query;
    //var objURL = url.parse(strURL);
}

exports.cmd = parse_cmd;