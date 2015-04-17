/**
 * Created by qqtech on 2015/4/17.
 */

var Call = exports.Call = function(opts) {
    opts = opts || {};
    this.uuid = opts.uuid || "";
    this.caller = opts.caller || "";
    this.callee = opts.callee || "";
    this.state = opts.state || "";
}