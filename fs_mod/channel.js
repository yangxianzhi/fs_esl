/**
 * Created by yangxz on 15-4-18.
 */

var Channel = exports.Channel = function(UniqueID){
    this.UniqueID = UniqueID;
    this.Name = null;
    this.State = null;
    this.Direction = null;
    this.CodecName = null;
    this.CallerNetworkAddr = null;
    this.OtherLegUniqueID = null;
    this.OtherLegDirection = null;
    this.OtherLegChannelName = null;
    this.OtherLegNetworkAddr = null;
}

Channel.prototype.UpdateInfo = function(evt){
    var self = this;
    self.Name = self.Name || evt.getHeader('Channel-Name');
    var state = evt.getHeader('Channel-State');
    if(state){
        self.State = state;
    }
    self.Direction = self.Direction || evt.getHeader('Call-Direction');
    self.CodecName = self.CodecName || evt.getHeader('Channel-Read-Codec-Name') + ' + ' + evt.getHeader('Channel-Write-Codec-Name');
    self.CallerNetworkAddr = self.CallerNetworkAddr || evt.getHeader('Caller-Network-Addr');
    self.OtherLegUniqueID = self.OtherLegUniqueID || evt.getHeader('Other-Leg-Unique-ID');
    self.OtherLegDirection = self.OtherLegDirection || evt.getHeader('Other-Leg-Direction');
    self.OtherLegChannelName = self.OtherLegChannelName || evt.getHeader('Other-Leg-Channel-Name');
    self.OtherLegNetworkAddr = self.OtherLegNetworkAddr || evt.getHeader('Other-Leg-Network-Addr');
}