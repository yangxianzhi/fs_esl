/**
 * Created by qqtech on 2015/4/14.
 */
var express = require('express');
var fsapp = require('../fs_mod/fs_app');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    fsapp.cmd(res,req);
});

module.exports = router;
