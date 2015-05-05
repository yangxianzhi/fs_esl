/**
 * Created by qqtech on 2015/4/17.
 */
var db = require('../db_mod/database');
var logger = require("../logger").getLogger();
var Channel = require('./channel').Channel;
var map = require('hashmap');

var Call = exports.Call = function(uuid,esl) {
    this.UUID = uuid;
    this.esl = esl;
    this.CalleeIDNumber = '';
    this.CallerIDNumber = '';
    this.AnsweredTime = '';
    this.HangupTime = '';
    this.HangupCause = '';
    this.CallDuration = 0;
    this.cost = 0;
    this.isInsert = false;
    this.channels = new map();
    this.billingrate = null;
}

Call.prototype.UpdateInfo = function(evt){
    var self = this;

    var UniqueID = evt.getHeader('Unique-ID');
    if(UniqueID){
        var channel=null;
        if(self.channels.has(UniqueID)){
            channel = self.channels.get(UniqueID);
        }
        else{
            if(evt.type == 'CHANNEL_CREATE') {
                channel = new Channel(UniqueID);
                self.channels.set(UniqueID, channel);
            }
        }

        if(channel){
            channel.UpdateInfo(evt,self);

            if(channel.billing_heartbeat && channel.billing_heartbeat != '0'){
                var args = new Array();
                args.push(channel.UniqueID);
                args.push(channel.billing_heartbeat);
                self.esl.esl_conn.api('uuid_session_heartbeat',args,function(res){
                    logger.info('switch_core_session_enable_heartbeat :' + res.getBody());
                    return;
                });
                channel.billing_heartbeat = '0';
            }
        }

        //var ChannelState = evt.getHeader('Channel-State');
        if(evt.type === 'CHANNEL_HANGUP'){
            self.channels.remove(UniqueID);
        }
    }

    var val = evt.getHeader('Caller-Callee-ID-Number');
    if(val)
        self.CalleeIDNumber = val;

    val = evt.getHeader('Caller-Caller-ID-Number');
    if(val)
        self.CallerIDNumber = val;

    val = evt.getHeader('Caller-Channel-Answered-Time');
    if(val && val != '0')
        self.AnsweredTime = val;

    val = evt.getHeader('Caller-Channel-Hangup-Time');
    if(val && val != '0')
        self.HangupTime = val

    val = evt.getHeader('Hangup-Cause');
    if(val)
        self.HangupCause = val;

    if(self.HangupTime !='' && self.HangupTime!= '0'
        && self.AnsweredTime !=''  && self.AnsweredTime != '0')
    {
        self.CallDuration = Math.round((parseInt(self.HangupTime,10) - parseInt(self.AnsweredTime,10))/1000000);
        if(self.billingrate){
            self.cost = self.CallDuration * self.billingrate / 60;
        }
    }

    var callState = evt.getHeader('Channel-Call-State');
    if(self.channels.count() === 0 && callState == 'HANGUP' && !self.isInsert){
        if(self.AnsweredTime != '')
            self.AnsweredTime = new Date(parseInt(self.AnsweredTime,10)/1000).toLocaleString();

        if(self.HangupTime != '')
            self.HangupTime = new Date(parseInt(self.HangupTime,10)/1000).toLocaleString();

        //insert MySQL //INSERT INTO calls (UUID, CalleeIDNumber ...) VALUES ('UUID', 'CalleeIDNumber'...)
        var sql = "INSERT INTO calls (UUID,cost,CalleeIDNumber,CallerIDNumber,HangupCause,AnsweredTime,HangupTime,CallDuration) VALUES ('" +
            self.UUID + "','" + self.cost + "','" + self.CalleeIDNumber + "','" + self.CallerIDNumber + "','" +
            self.HangupCause + "','" + self.AnsweredTime + "','" + self.HangupTime + "','" + self.CallDuration + "')";
        db.getDB().query(sql);
        self.isInsert = true;
        logger.info(sql);
    }
}