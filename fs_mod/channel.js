/**
 * Created by yangxz on 15-4-18.
 */

var Channel = exports.Channel = function(UniqueID){
    this.UniqueID = UniqueID;
    this.Name = null;
    this.State = null;
    this.Direction = null;
    this.CodecName = null;
    this.OtherLegUniqueID = null;
}

Channel.prototype.UpdateInfo = function(evt){
    var self = this;
    self.Name = self.Name || evt.getHeader('Channel-Name');
    var state = evt.getHeader('Channel-State');
    if(state){
        self.State = state;
    }
    self.Direction = self.Direction || evt.getHeader('Call-Direction');
    self.CodecName = self.CodecName || evt.getHeader('Channel-Read-Codec-Name');
    self.OtherLegUniqueID = self.OtherLegUniqueID || evt.getHeader('Other-Leg-Unique-ID');
}