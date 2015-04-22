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

ESL.prototype.ListenerEvent = function(webapp) {
    var self = this;
    if(self.esl_conn){
        self.esl_conn.on('esl::event::**', function(evt) {
            if(!(evt.type === 'RE_SCHEDULE'
                || evt.type === 'HEARTBEAT'
                || evt.type === 'PRESENCE_IN'
                || evt.type === 'CUSTOM'
                || evt.type === 'API'))
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
        });
    }
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
};

ESL.prototype.parseEvt = function(evt) {
    var self = this;
    var CallUUID = evt.getHeader('Channel-Call-UUID');
    var UniqueID = evt.getHeader('Unique-ID');
    var EvtName = evt.getHeader('Event-Name');
    var ChannelState = evt.getHeader('Channel-State');
    if(!CallUUID || !UniqueID)
        return;

    if(EvtName && EvtName.indexOf("CHANNEL") != -1){
        var call = self.findCalls(CallUUID);
        var channel = self.findChannels(UniqueID);
        if(EvtName === 'CHANNEL_CREATE'){
            if(!call){
                call = new Call(CallUUID);
                self.calls[CallUUID] = call;
            }
            if(!channel){
                channel = new Channel(UniqueID);
                self.channels[UniqueID] = channel;
            }
        }
        if(call){
            call.UpdateInfo(evt);
        }
        if(channel){
            channel.UpdateInfo(evt);
        }

        if(ChannelState === 'CS_DESTROY')
        {
            self.calls.remove(CallUUID);
            self.channels.remove(UniqueID);
        }
    }
}

ESL.prototype.findCalls  = function(uuid) {
    var self = this;
    return self.calls.has(uuid) ? self.calls.get(uuid) : null;
}

ESL.prototype.findChannels  = function(uuid) {
    var self = this;
    return self.channels.has(uuid) ? self.channels.get(uuid) : null;
}