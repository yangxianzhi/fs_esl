/**
 * Created by yangxz on 15-4-18.
 */
var db = require('../db_mod/database');
var logger = require("../logger").getLogger();
var billing = require('./billing').billing;

var Channel = exports.Channel = function(UniqueID){
    this.UniqueID = UniqueID;
    this.Name = '';
    this.HangupCause = '';
    this.CreatedTime = '';
    this.Direction = '';
    this.CodecName = '';
    this.CallerNetworkAddr = '';
    this.OtherLegUniqueID = '';
    this.OtherLegDirection = '';
    this.OtherLegChannelName = '';
    this.OtherLegNetworkAddr = '';
    this.billing_account = '';
    this.billing_heartbeat = null;
    this.isInsert = false;
    this.billing = new billing();
}

Channel.prototype.UpdateInfo = function(evt,call) {
    var self = this;
    self.billing.nibble(evt,call);

    var val = evt.getHeader('Hangup-Cause');
    if (val)
        self.HangupCause = val;

    val = evt.getHeader('Channel-Name');
    if (val && self.Name === '')
        self.Name = val;

    val = evt.getHeader('Call-Direction');
    if (val && self.Direction === '')
        self.Direction = val;

    val = evt.getHeader('Caller-Channel-Created-Time');
    if (val && val != '0' && self.CreatedTime === '')
        self.CreatedTime = new Date(parseInt(val,10)/1000).toLocaleString();

    self.CodecName = evt.getHeader('Channel-Read-Codec-Name') + ' + ' + evt.getHeader('Channel-Write-Codec-Name');

    val = evt.getHeader('Caller-Network-Addr');
    if (val && self.CallerNetworkAddr === '')
        self.CallerNetworkAddr = val;

    val = evt.getHeader('Other-Leg-Unique-ID');
    if (val && self.OtherLegUniqueID === '')
        self.OtherLegUniqueID = val;

    val = evt.getHeader('Other-Leg-Direction');
    if (val && self.OtherLegDirection === '')
        self.OtherLegDirection = val;

    val = evt.getHeader('Other-Leg-Channel-Name');
    if (val && self.OtherLegChannelName === '')
        self.OtherLegChannelName = val;

    val = evt.getHeader('Other-Leg-Network-Addr');
    if (val && self.OtherLegNetworkAddr === '')
        self.OtherLegNetworkAddr = val;

    val = evt.getHeader('variable_billing_account');
    if (val && self.billing_account === '')
        self.billing_account = val;

    self.billing_heartbeat = self.billing_heartbeat || evt.getHeader('variable_billing_heartbeat');

    if (evt.type === 'CHANNEL_HANGUP' && !self.isInsert) {
        var sql = "INSERT INTO channels (UniqueID,Name,HangupCause,CreatedTime,Direction,CodecName," +
            "CallerNetworkAddr,OtherLegUniqueID,OtherLegDirection,OtherLegChannelName," +
            "OtherLegNetworkAddr,billing_account) VALUES ('" +
            self.UniqueID + "','" + self.Name + "','" + self.HangupCause + "','" + self.CreatedTime + "','"
            + self.Direction + "','" + self.CodecName + "','" +
            self.CallerNetworkAddr + "','" + self.OtherLegUniqueID + "','" + self.OtherLegDirection + "','" +
            self.OtherLegChannelName + "','" + self.OtherLegNetworkAddr + "','" + self.billing_account + "')";
        db.getDB().query(sql);
        logger.info(sql);

        self.isInsert = true;
    }
}