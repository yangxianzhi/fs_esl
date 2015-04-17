/**
 * Created by qqtech on 2015/4/14.
 */
var esl = require('./esl');
var url = require('url');

function parse_cmd(res,req)
{
    var strURL = url.parse(req.originalUrl).query;
    //var objURL = url.parse(strURL);

    esl.getConn().api(strURL.toString(), function(res) {
        //res is an esl.Event instance
        console.log(res.getBody());
        res.send("");
    });

}

exports.cmd = parse_cmd;