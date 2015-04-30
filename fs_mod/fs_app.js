/**
 * Created by qqtech on 2015/4/14.
 */
var logger = require("../logger").getLogger();
var db = require('../db_mod/database');
var map = require('hashmap');

var FS_API = exports.FS_API = function(){
    this.sipusers = new map();
}

FS_API.prototype.parse_directory = function (req,res){
    var self = this;
    if(req && req.body){
        if(self.sipusers.has(req.body.user)){
            var xml = self.sipusers.get(req.body.user);
            res.send(xml);
        }
        else{
            var sql = "Select caller_id_number as user, caller_id_name as name," +
                "password, billing_account as account, outbound_caller_id_number as ANS" +
                " from sip_users where caller_id_number ='" + req.body.user + "'";
            db.getDB().query(sql, function(rows, fields){
                if(rows.length > 0){
                    var xml = '<document type="freeswitch/xml">\
                        <section name="directory">\
                        <domain name="' + req.body.domain + '">\
                        <params>\
                            <param name="dial-string" value="{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"/>\
                        </params>\
                        <groups>\
                        <group name="default">\
                        <users>\
                        <user id="' + rows[0].user + '">\
                        <params>\
                        <param name="password" value="' + rows[0].password + '"/>\
                        <param name="vm-password" value="' + req.body.user + '"/>\
                        </params>\
                        <variables>\
                        <variable name="toll_allow" value="domestic,international,local"/>\
                        <variable name="accountcode" value="' + rows[0].user + '"/>\
                        <variable name="user_context" value="custom_dialplan"/>\
                        <variable name="effective_caller_id_name" value="' + rows[0].name + '"/>\
                        <variable name="effective_caller_id_number" value="' + rows[0].user + '"/>\
                        <variable name="outbound_caller_id_name" value="' + rows[0].ANS + '"/>\
                        <variable name="outbound_caller_id_number" value="' + rows[0].ANS + '"/>\
                        <variable name="callgroup" value="default"/>\
                        <variable name="sip-force-contact" value="NDLB-connectile-dysfunction"/>\
                        <variable name="x-powered-by" value="http://www.freeswitch.org.cn"/>\
                        <variable name="billing_account" value="' + rows[0].account + '"/>\
                        <variable name="billing_rate" value="0.05"/>\
                        </variables>\
                        </user>\
                        </users>\
                        </group>\
                        </groups>\
                        </domain>\
                        </section>\
                        </document>\
                    ';
                    res.send(xml);
                    self.sipusers.set(rows[0].user,xml);
                }
            });
        }
    }
}
FS_API.prototype.parse_dialplan = function (req,res){
    var Context = req.body['Caller-Context'];
    if(Context === 'custom_dialplan'){
        res.send('<document type="freeswitch/xml">\
        <section name="dialplan" description="RE Dial Plan For FreeSwitch">\
        <context name="custom_dialplan">\
        <extension name="custom">\
        <condition field="destination_number" expression="^(.*)$">\
        <action application="transfer" data="$1 XML default"/>\
        </condition>\
        </extension>\
        </context>\
        </section>\
        </document>');
    }
    else if(Context === 'default'){
        res.send('default.xml');
    }
    else if(Context === 'public'){
        var sip_to_host = req.body['variable_sip_to_host'];
        var sip_to_user = req.body['variable_sip_to_user'];
        res.send('<document type="freeswitch/xml">\
        <section name="dialplan" description="RE Dial Plan For FreeSwitch">\
        <context name="public">\
        <extension name="custom_public">\
        <condition field="destination_number" expression="^(.*)$">\
        <action application="bridge" data="user/'+ sip_to_user + '@' + sip_to_host +'"/>\
        </condition>\
        </extension>\
        </context>\
        </section>\
        </document>');
    }
}
