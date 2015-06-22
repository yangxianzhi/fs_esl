/**
 * Created by qqtech on 2015/4/14.
 */
var mod_esl = require('modesl');
var Call = require('./call').Call;
var logger = require("../logger").getLogger('ConnEvent','INFO');
var map = require('hashmap');
var db = require('../db_mod/database');
var exec_cmd = require('./exec_shell').exec_cmd;
var EventEmitter = require('events').EventEmitter;

var ESL = exports.ESL = function()
{
    this.esl_server = null;
    this.esl_conn = null;
    this.calls = new map();
    this.sip_users_status = new map();
    this.event = new EventEmitter();
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
            logger.error('error:', err);
            //http服务接口会影响FreeSWITCH的启动过程，所以停止HTTP
            //FreeSWITCH启动会请求HTTP接口，导致FreeSWITCH的启动变慢。
            webapp.stopHttpServer(function(){
                logger.info('httpServer closed');
            });
            //启动定时检查机制
            self.event.on('checkFreeSWITCH',self.checkFreeSWITCH);
            setTimeout(function(){
                self.checkFreeSWITCH(webapp,self);
            }, 5000);
        });
    }
};

ESL.prototype.checkFreeSWITCH = function(webapp,self){
    exec_cmd('fs_cli -x status',function(error,stdout,stderr){
        if(error){
            setTimeout(function(){
                self.event.emit('checkFreeSWITCH',webapp,self);
            }, 5000);
            return;
        }

        logger.info('stdout:', stdout);
        self.event.removeListener('checkFreeSWITCH',self.checkFreeSWITCH);
        self.esl_conn = null;
        webapp.startEslConnect();
        setTimeout(webapp.startHttpServer(),2000);
    });
}

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
    /*调试使用
    if(evt.type === 'RECORD_START'){
        var debug = '';
        debug = debug +'';
    }*/
    if(evt.type === 'CUSTOM'){
        var user = evt.getHeader('from-user');
        if(user){
            var status = evt.getHeader('status') || 'UnRegistered';
            var index = status.indexOf('(');
            if(index != -1){
                status = status.substr(0,index);
            }
            var realm = evt.getHeader('to-host') || '';
            if(self.sip_users_status.has(user)){
                var old_status = self.sip_users_status.get(user);
                if(old_status === status) return; //状态没有变化，不继续处理，防止频繁操作数据库。
                self.sip_users_status.set(user,status);
            }
            else{
                self.sip_users_status.set(user,status);
            }
            var sql = "UPDATE sip_users SET status='"+status+"', realm='"+realm+"' WHERE caller_id_number='"+user+"'";
            db.getDB().query(sql);
        }
        return;
    }
    else if(evt.type != undefined && (evt.type.indexOf('CHANNEL') == 0 || evt.type.indexOf('RECORD') == 0)){/* || evt.type === 'CALL_UPDATE' || evt.type === 'CALL_SECURE'*/
        //var CallUUID = evt.getHeader('Channel-Call-UUID');
        var CallUUID = evt.getHeader('variable_sip_call_id');
        if(CallUUID){
            var call=null;
            if(self.calls.has(CallUUID)){
                call = self.calls.get(CallUUID);
            }
            else {
                if(evt.type == 'CHANNEL_CREATE'){
                    call = new Call(CallUUID,self);
                    self.calls.set(CallUUID, call);
                }
            }

            if(call){
                call.UpdateInfo(evt);
                if(call.isInsert){
                    self.calls.remove(CallUUID);
                }
            }
        }
    }
}
