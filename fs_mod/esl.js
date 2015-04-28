/**
 * Created by qqtech on 2015/4/14.
 */
var mod_esl = require('modesl');
var Call = require('./call').Call;
var Channel = require('./channel').Channel;
var logger = require("../logger").getLogger();
var map = require('hashmap');
var db = require('../db_mod/database');

var ESL = exports.ESL = function()
{
    this.esl_server = null;
    this.esl_conn = null;
    this.calls = new map();
    this.channels = new map();
}

ESL.prototype.StartServer = function (opt,cb)
{
    var self = this;
    if(!self.esl_server){
        self.esl_server = new mod_esl.Server(opt, function(){
            logger.info("esl_server is up %s:%d  myevents:%s",opt.host
                ,opt.port,opt.myevents);
            cb();
        });
    }
    return self.esl_server;
}
ESL.prototype.StartConnect = function (opt,cb)
{
    var self = this;
    if(!self.esl_conn){
        self.esl_conn = new mod_esl.Connection(opt.host, opt.port, opt.password, function() {
            logger.info("esl_connection is up");
            self.esl_conn.subscribe('ALL', function() {
                cb();
            });
        });
    }
    return self.esl_conn;
};

ESL.prototype.ListenerConnectEvent = function(webapp) {
    var self = this;
    if(self.esl_conn){
        self.esl_conn.on('esl::event::**', function(evt) {
            logger.debug('Event:', evt);
            self.parseEvt(evt);
        });

        self.esl_conn.on('esl::event::MESSAGE::*', function(evt) {
            var n = evt.getHeader('from-user'),
                seq = parseInt(evt.getHeader('Event-Sequence'), 10);

            //with action="fire" in the chatplan, you sometimes
            //will get the message 2 times O.o
            if(seq <= self.lastSeq) return;

            webapp.lastSeq = seq;

            if(webapp.clients[n]) {
                webapp.clients[n].emit('recvmsg', evt.getBody());
            }
            logger.debug('event::MESSAGE:', evt);
        });

        self.esl_conn.on('error', function(err) {
            logger.error(err);
            //启动定时检查机制
            self.esl_conn = null;
            setTimeout(function(){
                webapp.startEslConnect();
            }, 30000);
        });
    }
};

ESL.prototype.ListenerServerEvent = function(){
    var self = this;
    if(self.esl_server){
        self.esl_server.on('connection::ready', function(conn, id) {
            logger.debug('new call ' + id);
            conn.call_start = new Date().getTime();

            conn.execute('answer');
            conn.execute('echo', function(){
                logger.debug('echoing');
            });

            conn.on('esl::end', function(evt, body) {
                this.call_end = new Date().getTime();
                var delta = (this.call_end - this.call_start) / 1000;
                logger.debug("Call duration " + delta + " seconds");
            });
        });
    }
}

ESL.prototype.parseEvt = function(evt) {
    var self = this;
    if(evt.type === 'CUSTOM'){
        var status = evt.getHeader('status') || 'UnRegistered';
        var user = evt.getHeader('username');
        var realm = evt.getHeader('realm') || '';
        if(user){
            var sql = "UPDATE sip_users SET status='"+status+"', realm='"+realm+"' WHERE caller_id_number='"+user+"'";
            db.getDB().query(sql);
            logger.info(sql);
        }
        return;
    }
    var CallUUID = evt.getHeader('variable_call_uuid');
    if(CallUUID){
        var call=null;
        if(self.calls.has(CallUUID)){
            call = self.calls.get(CallUUID);
        }
        else {
            if(evt.getHeader('Channel-Call-State') != 'HANGUP')
            {
                call = new Call(CallUUID);
                self.calls.set(CallUUID, call);
            }
        }

        if(call){
            call.UpdateInfo(evt);
        }
        if(evt.getHeader('Event-Name') === 'CHANNEL_DESTROY')
        {
            self.calls.remove(CallUUID);
        }
    }

    var UniqueID = evt.getHeader('Unique-ID');
    if(UniqueID){
        var channel=null;
        if(self.channels.has(UniqueID)){
            channel = self.channels.get(UniqueID);
        }
        else{
            channel = new Channel(UniqueID);
            self.channels.set(UniqueID, channel);
        }

        if(channel){
            channel.UpdateInfo(evt);

            if(channel.billing_heartbeat && channel.billing_heartbeat != '0'){
                var args = new Array();
                args.push(channel.UniqueID);
                args.push(channel.billing_heartbeat);
                self.esl_conn.api('uuid_session_heartbeat',args,function(res){
                    logger.info('switch_core_session_enable_heartbeat :' + res.getBody());
                    return;
                });
                channel.billing_heartbeat = '0';
            }
        }

        var ChannelState = evt.getHeader('Channel-State');
        if(ChannelState === 'CS_DESTROY')
        {
            /*if(channel.billing_heartbeat === '0'){
                var args = new Array();
                args.push(channel.UniqueID);
                args.push(channel.billing_heartbeat);
                self.esl_conn.api('uuid_session_heartbeat',args,function(res){
                    logger.info('switch_core_session_disable_heartbeat :' + res.getBody());
                });
            }*/
            self.channels.remove(UniqueID);
        }
    }
}
