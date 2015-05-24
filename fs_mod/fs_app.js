/**
 * Created by qqtech on 2015/4/14.
 */
var logger = require("../logger").getLogger('FS_API');
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
                "password, billing_account as account, outbound_caller_id_number as ANI" +
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
                        <variable name="outbound_caller_id_name" value="' + rows[0].ANI + '"/>\
                        <variable name="outbound_caller_id_number" value="' + rows[0].ANI + '"/>\
                        <variable name="callgroup" value="default"/>\
                        <variable name="sip-force-contact" value="NDLB-connectile-dysfunction"/>\
                        <variable name="x-powered-by" value="http://www.freeswitch.org.cn"/>\
                        </variables>\
                        </user>\
                        </users>\
                        </group>\
                        </groups>\
                        </domain>\
                        </section>\
                        </document>\
                    ';
                    //<variable name="billing_account" value="' + rows[0].account + '"/>\
                    res.send(xml);
                    self.sipusers.set(rows[0].user,xml);
                }
            });
        }
    }
}
FS_API.prototype.parse_dialplan = function (req,res){
    var self = this;
    self.xml_record = '<action application="set" data="RECORD_TITLE=Recording \
        ${destination_number} ${caller_id_number} ${strftime(%Y-%m-%d %H:%M)}"/>\
        <action application="set" data="RECORD_COPYRIGHT=(c) 2011"/>\
        <action application="set" data="RECORD_SOFTWARE=FreeSWITCH"/>\
        <action application="set" data="RECORD_ARTIST=FreeSWITCH"/>\
        <action application="set" data="RECORD_COMMENT=FreeSWITCH"/>\
        <action application="set" data="RECORD_DATE=${strftime(%Y-%m-%d %H:%M)}"/>\
        <action application="set" data="RECORD_STEREO=true"/>\
        <action application="record_session" data="$${base_dir}/recordings/archive/[${strftime(%Y-%m-%d %H-%M-%S)}] ${caller_id_number}-${destination_number}.wav"/>';

    var Context = req.body['Caller-Context'];
    if(Context === 'custom_dialplan'){
        self.xml_start = '<document type="freeswitch/xml">\
                <section name="dialplan" description="RE Dial Plan For FreeSwitch">\
                <context name="custom_dialplan">';
        self.xml_end = '</context>\
                </section>\
                </document>';
        self.xml_default = '<extension name="custom_default">\
                <condition field="destination_number" expression="^(.*)$">'
                + self.xml_record +
                '<action application="transfer" data="$1 XML default"/>\
                </condition>\
                </extension>';
        var sip_to_user = req.body['Hunt-Destination-Number'];
        if(sip_to_user === '0000'){
            //工号绑定IVR
            var xml = '<extension name="ivr_demo">\
                <condition field="destination_number" expression="^(.*)$">\
                <action application="answer"/>\
                <action application="sleep" data="1000"/>\
                <action application="set" data="custom_welcome=10000"/>\
                <action application="ivr" data="custom_binding_ivr"/>\
                </condition>\
                </extension>';
            res.send(self.xml_start + xml + self.xml_end);
        }
        else if(sip_to_user.indexOf('binding_') == 0){
            var caller_id = req.body['Caller-Caller-ID-Number'];
            var number = sip_to_user.substr(sip_to_user.indexOf('_')+1);
            var sql = "UPDATE sip_users SET binding_work_number='"+number+"' WHERE caller_id_number='"+caller_id+"'";
            db.getDB().query(sql,function(){
                var xml = '<extension name="binding_demo">\
                <condition field="destination_number" expression="^(.*)$">\
                <action application="playback" data="$${base_dir}/sounds/custom_ivr/binding/binding_success.wav"/>\
                <action application="hangup"/>\
                </condition>\
                </extension>';
                res.send(self.xml_start + xml + self.xml_end);
            });
        }
        else if(sip_to_user === 'query_binding'){
            var caller_id = req.body['Caller-Caller-ID-Number'];
            var sql = "SELECT binding_work_number " +
                "FROM sip_users WHERE caller_id_number = '"+caller_id+"'";
            db.getDB().query(sql,function(rows,fields){
                var xml1 = '<extension name="query_binding_demo">\
                        <condition field="destination_number" expression="^(.*)$">';
                 var xml2 = ' <action application="ivr" data="custom_binding_ivr"/>\
                        </condition>\
                        </extension>';
                var xml = '';
                if(rows.length > 0) {
                    xml = '<action application="playback" data="$${base_dir}/sounds/custom_ivr/binding/binding_dinded.wav"/>';
                    var id = rows[0].binding_work_number;
                    if(id != ''){
                        for(var i in id){
                            xml = xml + '<action application="playback" data="$${base_dir}/sounds/custom_ivr/number/'+ id[i] +'.wav"/>';
                        }
                    }
                    else{
                        xml = '<action application="playback" data="$${base_dir}/sounds/custom_ivr/binding/binding_undind.wav"/>';
                    }
                }
                else{
                    xml = '<action application="playback" data="$${base_dir}/sounds/custom_ivr/binding/binding_undind.wav"/>';
                }
                xml = xml1 + xml + xml2;
                res.send(self.xml_start + xml + self.xml_end);
            });
        }
        else if(sip_to_user === 'cancel_binding'){
            var caller_id = req.body['Caller-Caller-ID-Number'];
            var sql = "UPDATE sip_users SET binding_work_number='' WHERE caller_id_number='"+caller_id+"'";
            db.getDB().query(sql,function(){
                var xml = '<extension name="cancel_binding_demo">\
                <condition field="destination_number" expression="^(.*)$">\
                <action application="playback" data="$${base_dir}/sounds/custom_ivr/binding/binding_success.wav"/>\
                <action application="hangup"/>\
                </condition>\
                </extension>';
                res.send(self.xml_start + xml + self.xml_end);
            });
        }
        else if(sip_to_user[0] === '9'){
            //内线打外线要计费
            //billing_yes=true 说明要计费
            //billing_heartbeat=60 设置计费心跳，没60秒计算一次费用。
            var sip_from_user = req.body['variable_sip_from_user'];
            var sql = "Select billing_account as account from sip_users where caller_id_number ='" + sip_from_user + "'";
            db.getDB().query(sql,function(rows,fields){
                if(rows.length > 0){
                    self.xml_record = self.xml_record.replace('archive',rows[0].account);
                    var xml = '<extension name="custom_outbount">\
                    <condition field="destination_number" expression="^9(.*)$">'
                    + self.xml_record +
                    '<action application="set" data="billing_yes=true"/>\
                    <action application="set" data="billing_heartbeat=60"/>\
                    <action application="set" data="billing_account=' + rows[0].account + '"/>\
                    <action application="bridge" data="sofia/gateway/gw1/$1"/>\
                    </condition>\
                    </extension>';
                    res.send(self.xml_start + xml + self.xml_end);
                }
            });
        }
        else if(sip_to_user.indexOf('10') == 0){
            //内线分机号码10开头
            var sql = "SELECT caller_id_number, binding_mobile_number,realm,resonance,billing_account " +
                "FROM sip_users WHERE caller_id_number = '"+sip_to_user+"'";
            db.getDB().query(sql,function(rows,fileds){
                if(rows.length > 0){
                    self._dialplan_res(rows,res);
                }
                else{
                    res.send(self.xml_start + self.xml_default + self.xml_end);
                }
            });
        }
        else{
            //可能是工号或直线号码
            var sql = "SELECT caller_id_number, binding_mobile_number,realm,resonance,billing_account " +
                "FROM sip_users WHERE binding_work_number = '"+sip_to_user+"'";
            db.getDB().query(sql,function(rows,fileds){
                if(rows.length > 0){
                    self._dialplan_res(rows,res);
                }else{
                    var sql = "SELECT caller_id_number, binding_mobile_number,realm,resonance,billing_account " +
                        "FROM sip_users WHERE binding_mobile_number = '"+sip_to_user+"'";
                    db.getDB().query(sql,function(rows,fileds){
                        if(rows.length > 0){
                            self._dialplan_res(rows,res);
                        }
                        else{
                            res.send(self.xml_start + self.xml_default + self.xml_end);
                        }
                    });
                }
            });
        }
    }
    else if(Context === 'default'){
        res.send('default.xml');
    }
    else if(Context === 'public'){
        res.send('<document type="freeswitch/xml">\
        <section name="dialplan" description="RE Dial Plan For FreeSwitch">\
        <context name="public">\
        <extension name="custom_public">\
        <condition field="destination_number" expression="^(.*)$">\
        <action application="transfer" data="$1 XML custom_dialplan"/>\
        </condition>\
        </extension>\
        </context>\
        </section>\
        </document>');
    }
}
FS_API.prototype._dialplan_res = function (rows, res){
    var self = this;
    var user = rows[0].caller_id_number;
    var mobile = rows[0].binding_mobile_number;
    var resonance = rows[0].resonance;
    var realm = rows[0].realm;
    var account = rows[0].billing_account;
    self.xml_record = self.xml_record.replace('archive',account);
    var xml = '<extension name="custom_dialplan_res0">\
            <condition field="destination_number" expression="^(.*)$">'
            + self.xml_record +
            '<action application="bridge" data="user/'+ user + '@' + realm +'"/>\
            </condition>\
            </extension>';
    if(resonance == '1'){
        xml = '<extension name="custom_dialplan_res1">\
            <condition field="destination_number" expression="^(.*)$">'
            + self.xml_record +
            '<action application="bridge" data="user/'+ user + '@' + realm + ',[billing_yes=true,billing_heartbeat=60,billing_account='+ account +']sofia/gateway/gw1/' + mobile + '"/>\
            </condition>\
            </extension>';

    }else if(resonance == '2'){
        xml = '<extension name="custom_dialplan_res2">\
            <condition field="destination_number" expression="^(.*)$">'
            + self.xml_record +
            '<action application="bridge" data="user/'+ user + '@' + realm + '|[billing_yes=true,billing_heartbeat=60,billing_account='+ account +']sofia/gateway/gw1/' + mobile + '"/>\
            </condition>\
            </extension>';

    }
    res.send(self.xml_start + xml + self.xml_end);
}
