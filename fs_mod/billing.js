/**
 * Created by qqtech on 2015/4/23.
 */

var db = require('../db_mod/database');
var map = require('hashmap');

var billing = exports.billing = function(){
    this.db_column_account = 'id';
    this.db_column_cash = 'cash';
    this.db_column_rate = 'rate';
    this.db_table = 'accounts';
    this.cash = null;
    this.isOpenedHeartbeat = false;
    this.billingAccount = null;
    this.billingrate = null;
    this.last_ts = null;
}

billing.prototype.nibble = function(evt,call) {
    var self = this;
    //var UniqueID = evt.getHeader('Unique-ID');
    self.billingAccount = self.billingAccount || evt.getHeader('variable_billing_account');

    if(self.billingAccount){
        if(!self.billingrate) {
            var sql = "SELECT " + self.db_column_rate + " AS nibble_balance FROM " + self.db_table
                + " WHERE " + self.db_column_account + " = '" + self.billingAccount + "'";

            db.getDB().query(sql, function (rows, fields) {
                if(rows.length > 0)
                    self.billingrate = rows[0].nibble_balance;
            });
        }
        if(self.billingrate) {
            if (call.CallState && call.CallState === 'RINGING' && self.isOpenedHeartbeat == false) {
                self.isOpenedHeartbeat = true;
            }

            if (call.AnsweredTime && call.AnsweredTime != '0' && !self.last_ts) {
                self.last_ts = call.AnsweredTime / 1000000;
            }

            var now = evt.getHeader( 'Event-Date-Timestamp');
            if(!now){
                now = new Date().getTime() / 1000;
            }
            else
                now = now / 1000000;

            if(self.last_ts ){
                var billing_amount = (now - self.last_ts) * (self.billingrate / 60);
                self.last_ts = now;
                var sql = "UPDATE " + self.db_table + " SET " + self.db_column_cash + "=" +  self.db_column_cash
                    + "-" + billing_amount + " WHERE " +self.db_column_account+ " ='" + self.billingAccount + "'";
                db.getDB().query(sql)
            }
        }
    }
}