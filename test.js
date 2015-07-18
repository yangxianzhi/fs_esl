/**
 * Created by yangxz on 15-5-23.
 */

/*var str = '<action application="set" data="RECORD_TITLE=Recording \
        ${destination_number} ${caller_id_number} ${strftime(%Y-%m-%d %H:%M)}"/>\
        <action application="set" data="RECORD_COPYRIGHT=(c) 2011"/>\
        <action application="set" data="RECORD_SOFTWARE=FreeSWITCH"/>\
        <action application="set" data="RECORD_ARTIST=FreeSWITCH"/>\
        <action application="set" data="RECORD_COMMENT=FreeSWITCH"/>\
        <action application="set" data="RECORD_DATE=${strftime(%Y-%m-%d %H:%M)}"/>\
        <action application="set" data="RECORD_STEREO=true"/>\
        <action application="record_session" data="$${base_dir}/recordings/archive/[${strftime(%Y-%m-%d %H-%M-%S)}] ${caller_id_number}-${destination_number}.wav"/>';

console.log(str.replace('archive','asdfasdf'));*/
var http = require('http');
var querystring = require('querystring');
var exec_cmd = require('./fs_mod/exec_shell').exec_cmd;
var cmd = 'status';
exec_cmd('fs_cli -x "'+cmd+'"',function(error,stdout,stderr){
    var msg = '';
    if(error){
        msg += '{"type":"error",';
        msg += '"message":"'+error.message+'"}';
    }
    else{
        msg += '{"type":"success",';
        msg += '"message":"'+stdout+'"}';
    }
    console.log(msg);
});

var postData = {
    'cmd' : 'status'//,
    //'args': [
    //    'arg1',
    //    'arg2'
    //]
};

var data = querystring.stringify(postData);
var options = {
    host: '127.0.0.1',
    port: 8181,
    path: '/freeswitch_cmd',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length':data.length
    }
};

var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
    });
});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

// write data to request body
req.write(data + '\n');
req.end();