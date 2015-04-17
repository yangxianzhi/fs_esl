/**
 * Created by qqtech on 2015/4/14.
 */
var mod_esl = require('modesl');
var logger = require("../logger").getLogger();

var ESL = exports.ESL = function()
{
    this.esl_server = null;
    this.esl_conn = null;
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
            if(!(evt.type === 'RE_SCHEDULE' || evt.type === 'HEARTBEAT'))
            logger.debug('Event:', evt);
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
