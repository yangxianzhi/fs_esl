/**
 * Created by qqtech on 2015/4/14.
 */
var logger = require("../logger").getLogger('FS_API','INFO');
var db = require('../db_mod/database');
var map = require('hashmap');
var EventEmitter = require('events').EventEmitter;
var exec_cmd = require('./exec_shell').exec_cmd;

var FS_API = exports.FS_API = function(){
    this.sipusers = new map();
    this.event = new EventEmitter();
    this.event.on('checkConfigUpdate',this.checkConfigUpdate);
    setTimeout(this.checkConfigUpdate, 10 * 60 * 1000, this);
}
FS_API.prototype.checkConfigUpdate = function (self){
    self.sipusers.forEach(function(value, key){
        var sql = "SELECT a.hotlineNO as ANI, s.billing_account as account, " +
            "s.caller_id_number as user, s.caller_id_name as name, s.password " +
            "FROM ACCOUNTCONFIG a INNER JOIN sip_users s ON a.accountId = s.billing_account " +
            "WHERE s.caller_id_number = '" + key + "'";
        db.getDB().query(sql, function(rows, fields){
            if(rows.length > 0){
                self.sipusers.set(rows[0].user,rows[0]);
            }
        });
    });

    setTimeout(function(){
        self.event.emit('checkConfigUpdate',self);
    },10 * 60 * 1000);
    logger.info('checkConfigUpdate called!!');
}
FS_API.prototype.parse_directory = function (req,res){
    var self = this;
    if(req && req.body){
     if(self.sipusers.has(req.body.user)){
            var row = self.sipusers.get(req.body.user);
            self.res_regist(row,req,res);
        }
        else{
            /*var sql = "Select caller_id_number as user, caller_id_name as name," +
                "password, billing_account as account, outbound_caller_id_number as ANI" +
                " from sip_users where caller_id_number ='" + req.body.user + "'";*/
            var sql = "SELECT a.hotlineNO as ANI, s.billing_account as account, " +
                "s.caller_id_number as user, s.caller_id_name as name, s.password " +
                "FROM ACCOUNTCONFIG a INNER JOIN sip_users s ON a.accountId = s.billing_account " +
                "WHERE s.caller_id_number = '" + req.body.user + "'";
            db.getDB().query(sql, function(rows, fields){
                if(rows.length > 0){
                    self.sipusers.set(rows[0].user,rows[0]);
                    self.res_regist(rows[0],req,res);
                }
            });
        }
    }
}
FS_API.prototype.res_regist = function(row, req, res){
    var xml = '<document type="freeswitch/xml">\
    <section name="directory">\
    <domain name="' + req.body.domain + '">\
    <params>\
    <param name="dial-string" value="{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"/>\
    </params>\
    <groups>\
    <group name="default">\
    <users>\
    <user id="' + row.user + '">\
    <params>\
    <param name="password" value="' + row.password + '"/>\
    <param name="vm-password" value="' + req.body.user + '"/>\
    </params>\
    <variables>\
    <variable name="toll_allow" value="domestic,international,local"/>\
    <variable name="accountcode" value="' + row.user + '"/>\
    <variable name="user_context" value="custom_dialplan"/>\
    <variable name="effective_caller_id_name" value="' + row.name + '"/>\
    <variable name="effective_caller_id_number" value="' + row.user + '"/>\
    <variable name="outbound_caller_id_name" value="' + row.ANI + '"/>\
    <variable name="outbound_caller_id_number" value="' + row.ANI + '"/>\
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
    </document>';
    //<variable name="billing_account" value="' + row.account + '"/>\
    res.send(xml);
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
        <action application="record_session" data="$${base_dir}/recordings/archive/${strftime(%Y-%m-%d)}/${caller_id_number}/[${strftime(%Y-%m-%d %H-%M-%S)}] ${caller_id_number}-${destination_number}.wav"/>';

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
        '<action application="transfer" data="8888 XML custom_dialplan"/>\
        </condition>\
        </extension>';
        var sip_from_user = req.body['variable_sip_from_user'];
        var sql = "SELECT a.cash, a.status " +
            "FROM ACCOUNT a INNER JOIN sip_users s ON a.ID = s.billing_account " +
            "WHERE s.caller_id_number = '" + sip_from_user + "'";
        db.getDB().query(sql,function(rows,fields){
            if(rows.length>0){
                var status = parseInt(rows[0].status,10);
                if(status == 2){
                    var audio = 'account_stop';
                    var xml = '<extension name="custom_outbount">\
                            <condition field="destination_number" expression="^(.*)$">\
                            <action application="playback" data="$${base_dir}/sounds/custom_ivr/'+audio+'.wav"/>\
                            <action application="hangup" data="NORMAL_CLEARING"/>\
                            </condition>\
                            </extension>';
                    res.send(self.xml_start + xml + self.xml_end);
                }
                else{
                    var Destination_Number = req.body['Hunt-Destination-Number'];
                    if(Destination_Number === '0000'){
                        //工号绑定IVR
                        var xml = '<extension name="ivr_demo">\
                <condition field="destination_number" expression="^(.*)$">\
                <action application="answer"/>\
                <action application="sleep" data="1000"/>\
                <action application="ivr" data="custom_binding_ivr"/>\
                </condition>\
                </extension>';
                        res.send(self.xml_start + xml + self.xml_end);
                    }
                    else if(Destination_Number === '8888'){
                        //欢迎语IVR
                        var xml = '<extension name="ivr_demo">\
                            <condition field="destination_number" expression="^(.*)$">\
                            <action application="answer"/>\
                            <action application="sleep" data="1000"/>\
                            <action application="ivr" data="custom_welcome_ivr"/>\
                            </condition>\
                            </extension>';
                        res.send(self.xml_start + xml + self.xml_end);
                    }
                    else if(Destination_Number === 'welcome'){
                        var sip_to_user = req.body['variable_sip_to_user'];
                        /*var sql = "SELECT caller_id_number, binding_mobile_number,realm,resonance,billing_account " +
                         "FROM sip_users WHERE outbound_caller_id_number = '"+sip_from_user+"'";*/
                        var sql = "SELECT s.caller_id_number, s.binding_mobile_number, s.realm, s.resonance, s.billing_account " +
                            "FROM ACCOUNTCONFIG a INNER JOIN sip_users s ON a.accountId = s.billing_account AND " +
                            "s.caller_id_number = a.frontDesk WHERE a.serviceNO like '%" + sip_to_user + "%'";
                        db.getDB().query(sql,function(rows,fileds){
                            if(rows.length > 0){
                                self._dialplan_res(rows,res);
                            }
                            else{
                                res.send(self.xml_start + self.xml_default + self.xml_end);
                            }
                        });
                    }
                    else if(Destination_Number.indexOf('binding_') == 0){
                        var caller_id = req.body['Caller-Caller-ID-Number'];
                        var number = Destination_Number.substr(Destination_Number.indexOf('_')+1);
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
                    else if(Destination_Number === 'query_binding'){
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
                    else if(Destination_Number === 'cancel_binding'){
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
                    else if(Destination_Number === '9196'){
                        var xml = '<extension name="echo">\
                <condition field="destination_number" expression="^9196$">\
                <action application="answer"/>\
                <action application="echo"/>\
                </condition>\
                </extension>';
                        res.send(self.xml_start + xml + self.xml_end);
                    }
                    else if(Destination_Number[0] === '9'){
                        var sip_from_user = req.body['variable_sip_from_user'];
                        var sql = "SELECT a.cash, a.status " +
                            "FROM ACCOUNT a INNER JOIN sip_users s ON a.ID = s.billing_account " +
                            "WHERE s.caller_id_number = '" + sip_from_user + "'";
                        db.getDB().query(sql,function(rows,fields){
                            if(rows.length > 0){
                                if(parseFloat(rows[0].cash) <= 0){
                                    var audio = 'cash_insufficient';
                                    var xml = '<extension name="custom_outbount">\
                                        <condition field="destination_number" expression="^(.*)$">\
                                        <action application="playback" data="$${base_dir}/sounds/custom_ivr/'+audio+'.wav"/>\
                                        <action application="hangup" data="NORMAL_CLEARING"/>\
                                        </condition>\
                                        </extension>';
                                    res.send(self.xml_start + xml + self.xml_end);
                                }
                                else{
                                    //内线打外线要计费
                                    //billing_yes=true 说明要计费
                                    //billing_heartbeat=60 设置计费心跳，没60秒计算一次费用。
                                    sql = "Select billing_account as account from sip_users where caller_id_number ='" + sip_from_user + "'";
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
                            }
                        });
                    }
                    else if(Destination_Number.indexOf('10') == 0){
                        //内线分机号码10开头
                        var sql = "SELECT caller_id_number, binding_mobile_number,realm,resonance,billing_account " +
                            "FROM sip_users WHERE caller_id_number = '"+Destination_Number+"'";
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
                            "FROM sip_users WHERE binding_work_number = '"+Destination_Number+"'";
                        db.getDB().query(sql,function(rows,fileds){
                            if(rows.length > 0){
                                self._dialplan_res(rows,res);
                            }else{
                                var sql = "SELECT caller_id_number, binding_mobile_number,realm,resonance,billing_account " +
                                    "FROM sip_users WHERE binding_mobile_number = '"+Destination_Number+"'";
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
            }
        });
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
            '<action application="set" data="continue_on_fail=true"/>\
            <action application="export" data="dialed_extension=$1"/>\
            <action application="bridge" data="user/'+ user + '@' + realm +'"/>\
            <action application="answer"/>\
            <action application="ivr" data="leave_message_ivr"/>\
            </condition>\
            </extension>';
    if(resonance == '0') {
        res.send(self.xml_start + xml + self.xml_end);
    }
    else {
        var sql = "SELECT cash, status FROM ACCOUNT WHERE ID = '" + account + "'";
        db.getDB().query(sql,function(rows,fields){
           if(rows.length > 0){
               if(parseFloat(rows[0].cash) <= 0){
                   res.send(self.xml_start + xml + self.xml_end);
               }
               else{
                   if(resonance == '1'){
                       xml = '<extension name="custom_dialplan_res1">\
                        <condition field="destination_number" expression="^(.*)$">'
                       + self.xml_record +
                       '<action application="bridge" data="user/'+ user + '@' + realm + ',[billing_yes=true,billing_heartbeat=60,billing_account='+ account +']sofia/gateway/gw1/' + mobile + '"/>\
                        </condition>\
                        </extension>';
                   }
                   else if(resonance == '2'){
                       xml = '<extension name="custom_dialplan_res2">\
                        <condition field="destination_number" expression="^(.*)$">'
                       + self.xml_record +
                       '<action application="bridge" data="user/'+ user + '@' + realm + '|[billing_yes=true,billing_heartbeat=60,billing_account='+ account +']sofia/gateway/gw1/' + mobile + '"/>\
                        </condition>\
                        </extension>';
                   }
                   res.send(self.xml_start + xml + self.xml_end);
               }
           }
        });
    }
}
FS_API.prototype.parse_configuration = function(req, res){
    var ivr_menu_name = req.body['Menu-Name'];
    var xml_start = '<document type="freeswitch/xml">\
        <section name="configuration">\
        <configuration name="ivr.conf" description="IVR menus">\
        <menus>\
        <menu name="'+ivr_menu_name+'"';
    var xml_end = '</menu>\
        </menus>\
        </configuration>\
        </section>\
        </document>';
    var xml;
    switch (ivr_menu_name){
        case 'custom_welcome_ivr' :
        {
            xml = 'greet-long="$${base_dir}/sounds/custom_ivr/welcome.wav"\
                greet-short="$${base_dir}/sounds/custom_ivr/welcome_short.wav"\
                invalid-sound="$${base_dir}/sounds/custom_ivr/binding/input_error.wav"\
                exit-sound="$${base_dir}/sounds/custom_ivr/binding/input_error_3_times.wav"\
                confirm-macro=""\
                confirm-key=""\
                tts-engine="flite"\
                tts-voice="rms"\
                confirm-attempts="3"\
                timeout="10000"\
                digit-len="4"\
                inter-digit-timeout="2000"\
                max-failures="3"\
                max-timeouts="3">\
                <entry action="menu-exec-app" digits="0" param="transfer welcome XML custom_dialplan"/>\
                <entry action="menu-exec-app" digits="/^([0-9][0-9][0-9][0-9])$/" param="transfer $1 XML custom_dialplan"/>'
            break;
        }
        case 'custom_binding_ivr' :
        {
        //工号绑定IVR
            xml = 'greet-long="$${base_dir}/sounds/custom_ivr/binding/binding_main.wav"\
                greet-short="$${base_dir}/sounds/custom_ivr/binding/binding_main.wav"\
                invalid-sound="$${base_dir}/sounds/custom_ivr/binding/input_error.wav"\
                exit-sound="$${base_dir}/sounds/custom_ivr/binding/input_error_3_times.wav"\
                confirm-macro=""\
                confirm-key=""\
                tts-engine="flite"\
                tts-voice="rms"\
                confirm-attempts="3"\
                timeout="10000"\
                max-failures="3"\
                max-timeouts="3">\
                <entry action="menu-sub" digits="1" param="binding_sub_ivr"/>\
                <entry action="menu-exec-app" digits="2" param="transfer query_binding XML custom_dialplan"/>\
                <entry action="menu-exec-app" digits="3" param="transfer cancel_binding XML custom_dialplan"/>';
            break;
        }
        case 'binding_sub_ivr' :
        {
            //工号绑定IVR, Sub Menu
            xml = 'greet-long="$${base_dir}/sounds/custom_ivr/binding/input_WorkNumber.wav"\
                greet-short="$${base_dir}/sounds/custom_ivr/binding/input_WorkNumber.wav"\
                invalid-sound="$${base_dir}/sounds/custom_ivr/binding/input_error.wav"\
                exit-sound="$${base_dir}/sounds/custom_ivr/binding/input_error_3_times.wav"\
                timeout="10000"\
                max-failures="3"\
                max-timeouts="3"\
                inter-digit-timeout="2000"\
                digit-len="4">\
                <entry action="menu-exec-app" digits="/^([0-9][0-9][0-9][0-9])$/" param="transfer binding_$1 XML custom_dialplan"/>\
                <entry action="menu-top" digits="*"/>';
            break;
        }
        case 'leave_message_ivr' :
        {
            xml = 'greet-long="$${base_dir}/sounds/custom_ivr/binding/input_WorkNumber.wav"\
                greet-short="$${base_dir}/sounds/custom_ivr/binding/input_WorkNumber.wav"\
                invalid-sound="$${base_dir}/sounds/custom_ivr/binding/input_error.wav"\
                exit-sound="$${base_dir}/sounds/custom_ivr/binding/input_error_3_times.wav"\
                timeout="10000"\
                max-failures="3"\
                max-timeouts="3"\
                inter-digit-timeout="2000"\
                digit-len="4">\
                <entry action="menu-exec-app" digits="1" param="record_session::$${recordings_dir}/leave_message_ivr/${caller_id_number}.${strftime(%Y-%m-%d-%H-%M-%S)}.wav"/>';
            break;
        }
    }
    res.send(xml_start + xml + xml_end);
    logger.info('parse_configuration called!!');
}
FS_API.prototype.fs_cmd = function(req, res){
    var cmd = req.body.cmd;
    var args = req.body.args;
    for(var i in args){
        cmd += ' ';
        cmd += args[i];
    }
    exec_cmd('fs_cli -x '+cmd,function(error,stdout,stderr){
        if(error){
            res.send(error.message);
            return;
        }

        logger.info('stdout:', stdout);
        res.send(stdout);
    });
}