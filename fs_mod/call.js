/**
 * Created by qqtech on 2015/4/17.
 */

var Call = exports.Call = function(uuid) {
    this.UUID = uuid;
    this.CalleeIDNumber = null;
    this.CalleeIDName = null;
    this.CallerIDNumber = null;
    this.CallerIDName = null;
    this.CallState = null;
    this.AnswerState = null;
    this.AnsweredTime = null;
    this.HangupTime = null;
    this.HangupCause = null;
    this.CallDuration = null;
}

Call.prototype.UpdateInfo = function(evt){
    var self = this;
    self.CalleeIDName = self.CalleeIDName || evt.getHeader('Caller-Callee-ID-Name');
    self.CalleeIDNumber = self.CalleeIDNumber || evt.getHeader('Caller-Callee-ID-Number');
    self.CallerIDName = self.CallerIDName || evt.getHeader('Caller-Caller-ID-Name');
    self.CallerIDNumber = self.CallerIDNumber || evt.getHeader('Caller-Caller-ID-Number');

    var callState = evt.getHeader('Channel-Call-State');
    if(callState)
        self.CallState = callState;

    var answerState = evt.getHeader('Answer-State');
    if(answerState)
        self.AnswerState = answerState;

    var time = evt.getHeader('Caller-Channel-Answered-Time');
    if(time && time != '0')
        self.AnsweredTime = time;

    time = evt.getHeader('Caller-Channel-Hangup-Time');
    if(time && time != '0')
        self.HangupTime = time

    self.HangupCause = self.HangupCause || evt.getHeader('Hangup-Cause');

    if(self.HangupTime && self.HangupTime!= '0' && self.AnsweredTime && self.AnsweredTime != '0' && !self.CallDuration)
    {
        self.CallDuration = Math.round((parseInt(self.HangupTime,10) - parseInt(self.AnsweredTime,10))/1000000);
    }
}