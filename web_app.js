/**
 * Created by qqtech on 2015/4/16.
 */
var sio = require('socket.io');
var app = require('./app');
var esl = require('./esl');

var valMap = {};

var WebApp = exports.WebApp = function(opts) {
    opts = opts || {};
    this.config = require('./config.json');
    this.port = opts.port || this.config.httpServer.port || 8181;
    this.host = opts.host || this.config.httpServer.host || '0.0.0.0';
    this.provider = opts.provider || this.config.httpServer.provider || 'sms-proxy-01.bandwidthclec.com';
    this.from = opts.from || this.config.httpServer.from || '19515529832@199.44.241.115';
    this.profile = opts.profile || this.config.httpServer.profile || 'external';
    this.app = app;
    this.clients = {};
    this.lastSeq = 0;
};

WebApp.prototype._configure = function() {
    var self = this;
    //self.app.use(express.static('public'));
    //self.app.use(express.static(path.join(__dirname, '../public')));
    //self.io.set('log level', 1);
    //self.io.debug.set();
};

WebApp.prototype.set = function(key, val, cb){
    valMap[key] = val;
    cb();
}

WebApp.prototype.get = function(key, cb){
    var error = null;
    var val = valMap[key];
    if(!val){
        error = "not found key:" + key;
    }
    cb(error,val);
}

WebApp.prototype._init = function() {
    var self = this;

    //self.app.get('/', function(req, res) {
    //   res.render('index.html');
    //});
    self.io.on('connection', function(socket) {
        socket.on('setup', function(num, fn) {
            if(num.length === 10) num = '1' + num.toString();

            self.clients[num.toString()] = socket;
            self.set(socket.id, num.toString(), function() {
                fn();
            });
        });

        socket.on('sendmsg', function(msg, fn) {
            self.get(socket.id, function(err, num) {
                self.fsw.message({
                    to: num + '@' + self.provider,
                    from: self.from,
                    profile: self.profile,
                    body: msg
                }, function(evt) {
                    fn(evt.serialize('json'));
                });
            });
        });
    });
};

WebApp.prototype.start = function() {
    var self = this;
    var server = self.app.StartListen(self.port, self.host);
    self.io = sio.listen(server);

    //connect to freeswitch
    self.fsw = esl.GetConnect(self.config.fsw,function() {
        console.log("esl_connection is up");
        self.fsw.subscribe('MESSAGE', function() {
            //self._configure();
            self._init();
        });
    });

    self.esl_server = esl.GetServer(self.config.server,function(){
        console.log("esl_server is up %s:%d  myevents:%s",self.config.server.host
            ,self.config.server.port,self.config.server.myevents);
    });

    esl.ListenerEvent(self);
};
