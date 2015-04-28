/**
 * Created by qqtech on 2015/4/17.
 */
var db = require('../db_mod/database');
var logger = require("../logger").getLogger();
var billing = require('./billing').billing;

var Call = exports.Call = function(uuid) {
    this.UUID = uuid;
    this.CalleeIDNumber = '';
    this.CalleeIDName = '';
    this.CallerIDNumber = '';
    this.CallerIDName = '';
    this.CallState = '';
    this.AnswerState = '';
    this.AnsweredTime = '';
    this.HangupTime = '';
    this.HangupCause = '';
    this.direction = '';
    this.CallDuration = 0;
    this.billing = new billing();
    this.isInsert = false;
}

Call.prototype.UpdateInfo = function(evt){
    var self = this;
    self.billing.nibble(evt,self);

    var val = evt.getHeader('Channel-Call-State');
    //if(val === self.CallState) return;
    if(val)
        self.CallState = val;

    val = evt.getHeader('Answer-State');
    if(val)
        self.AnswerState = val;

    val = evt.getHeader('Caller-Callee-ID-Name');
    if(val && self.CalleeIDName === '')
        self.CalleeIDName = val;

    val = evt.getHeader('Caller-Callee-ID-Number');
    if(val && self.CalleeIDNumber === '')
        self.CalleeIDNumber = val;

    val = evt.getHeader('Caller-Caller-ID-Name');
    if(val && self.CallerIDName === '')
        self.CallerIDName = val;

    val = evt.getHeader('Caller-Caller-ID-Number');
    if(val && self.CallerIDNumber === '')
        self.CallerIDNumber = val;

    val = evt.getHeader('Caller-Channel-Answered-Time');
    if(val && val != '0' && self.AnsweredTime === '')
        self.AnsweredTime = val;

    val = evt.getHeader('Caller-Channel-Hangup-Time');
    if(val && val != '0' && self.HangupTime === '')
        self.HangupTime = val

    val = evt.getHeader('Hangup-Cause');
    if(val && self.HangupCause === '')
        self.HangupCause = val;

    if(self.HangupTime !='' && self.HangupTime!= '0'
        && self.AnsweredTime !=''  && self.AnsweredTime != '0'
        && self.CallDuration == 0)
    {
        self.CallDuration = Math.round((parseInt(self.HangupTime,10) - parseInt(self.AnsweredTime,10))/1000000);
    }

    if(self.CallState === 'HANGUP' && !self.isInsert){
        if(self.AnsweredTime != '')
            self.AnsweredTime = new Date(parseInt(self.AnsweredTime,10)/1000).toLocaleString();

        if(self.HangupTime != '')
            self.HangupTime = new Date(parseInt(self.HangupTime,10)/1000).toLocaleString();

        //insert MySQL //INSERT INTO calls (UUID, CalleeIDNumber ...) VALUES ('UUID', 'CalleeIDNumber'...)
        var sql = "INSERT INTO calls (UUID,CalleeIDNumber,CalleeIDName,CallerIDNumber,CallerIDName,CallState,AnswerState,HangupCause,AnsweredTime,HangupTime,CallDuration) VALUES ('" +
            self.UUID + "','" + self.CalleeIDNumber + "','" + self.CalleeIDName + "','" + self.CallerIDNumber + "','" +
            self.CallerIDName + "','" + self.CallState + "','" + self.AnswerState + "','" + self.HangupCause + "','" +
            self.AnsweredTime + "','" + self.HangupTime + "','" + self.CallDuration + "')";
        db.getDB().query(sql);
        logger.debug(sql);

        self.isInsert = true;
    }
}