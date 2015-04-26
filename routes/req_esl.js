/**
 * Created by qqtech on 2015/4/14.
 */
//var express = require('express');
var fsapp = require('../fs_mod/fs_app');
//var router = express.Router();

/* GET users listing. */
//router.get('/', function(req, res, next) {
//    fsapp.cmd(res,req);
//});
//module.exports = router;

exports.fsapi = function(req,res) {
    res.send('<document type="freeswitch/xml">\
        <section name="directory">\
        <domain name="' + req.body.domain + '">\
        <params>\
            <param name="dial-string" value="{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"/>\
        </params>\
        <groups>\
        <group name="default">\
        <users>\
        <user id="' + req.body.user + '">\
        <params>\
        <param name="password" value="1234"/>\
        <param name="vm-password" value="' + req.body.user + '"/>\
        </params>\
        <variables>\
        <variable name="toll_allow" value="domestic,international,local"/>\
        <variable name="accountcode" value="' + req.body.user + '"/>\
        <variable name="user_context" value="default"/>\
        <variable name="effective_caller_id_name" value="FreeSWITCH-CN 1000"/>\
        <variable name="effective_caller_id_number" value="' + req.body.user + '"/>\
        <variable name="callgroup" value="default"/>\
        <variable name="sip-force-contact" value="NDLB-connectile-dysfunction"/>\
        <variable name="x-powered-by" value="http://www.freeswitch.org.cn"/>\
        <variable name="billing_account" value="83245707"/>\
        <variable name="billing_rate" value="0.05"/>\
        </variables>\
        </user>\
        </users>\
        </group>\
        </groups>\
        </domain>\
        </section>\
        </document>\
    ');
}
