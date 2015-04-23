/**
 * Created by yangxz on 15-4-18.
 */
var db = require('../db_mod/database');
var logger = require("../logger").getLogger();

var Channel = exports.Channel = function(UniqueID){
    this.UniqueID = UniqueID;
    this.Name = '';
    this.State = '';
    this.Direction = '';
    this.CodecName = '';
    this.CallerNetworkAddr = '';
    this.OtherLegUniqueID = '';
    this.OtherLegDirection = '';
    this.OtherLegChannelName = '';
    this.OtherLegNetworkAddr = '';
    this.billing_account = '';
    this.isInsert = false;
}

Channel.prototype.UpdateInfo = function(evt) {
    var self = this;

    var val = evt.getHeader('Channel-State');
    //if (val === self.State) return;
    if (val)
        self.State = val;

    val = evt.getHeader('Channel-Name');
    if (val && self.Name === '')
        self.Name = val;

    val = evt.getHeader('Call-Direction');
    if (val && self.Direction === '')
        self.Direction = val;

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

    if (self.State === 'CS_DESTROY' && !self.isInsert) {
        var sql = "INSERT INTO channels (UniqueID,Name,State,Direction,CodecName,CallerNetworkAddr,OtherLegUniqueID,OtherLegDirection,OtherLegChannelName,OtherLegNetworkAddr,billing_account) VALUES ('" +
            self.UniqueID + "','" + self.Name + "','" + self.State + "','" + self.Direction + "','" + self.CodecName + "','" +
            self.CallerNetworkAddr + "','" + self.OtherLegUniqueID + "','" + self.OtherLegDirection + "','" +
            self.OtherLegChannelName + "','" + self.OtherLegNetworkAddr + "','" + self.billing_account + "')";
        db.getDB().query(sql);
        logger.debug(sql);

        self.isInsert = true;
    }
}