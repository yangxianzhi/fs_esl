/**
 * Created by qqtech on 2015/4/14.
 */
var mod_esl = require('modesl');
var esl_conn = null;
var esl_server = null;

function GetServer(opt,cb)
{
    return esl_server = new mod_esl.Server(opt, cb);
}

function GetConnect(opt,cb)
{
    return esl_conn = new mod_esl.Connection(opt.host, opt.port, opt.password, cb);
};

exports.getConn = function(){
    return esl_conn;
};

exports.ListenerEvent = function(self) {
    if(esl_conn){
        esl_conn.on('esl::event::**', function(evt) {
            console.log('Event:', evt);
        });

        esl_conn.on('esl::event::MESSAGE::*', function(evt) {
            var n = evt.getHeader('from_user'),
                seq = parseInt(evt.getHeader('Event-Sequence'), 10);

            //with action="fire" in the chatplan, you sometimes
            //will get the message 2 times O.o
            if(seq <= self.lastSeq) return;

            self.lastSeq = seq;

            if(self.clients[n]) {
                self.clients[n].emit('recvmsg', evt.getBody());
            }
        });

        esl_conn.on('error', function(err) {
            console.log(err);
        });
    }
    if(esl_server){
        esl_server.on('connection::ready', function(conn, id) {
            console.log('new call ' + id);
            conn.call_start = new Date().getTime();

            conn.execute('answer');
            conn.execute('echo', function(){
                console.log('echoing');
            });

            conn.on('esl::end', function(evt, body) {
                this.call_end = new Date().getTime();
                var delta = (this.call_end - this.call_start) / 1000;
                console.log("Call duration " + delta + " seconds");
            });
        });
    }
};

exports.GetConnect = GetConnect;
exports.GetServer = GetServer;