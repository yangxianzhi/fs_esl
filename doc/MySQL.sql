/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50621
Source Host           : 192.168.1.35:3306
Source Database       : test

Target Server Type    : MYSQL
Target Server Version : 50621
File Encoding         : 65001

Date: 2015-04-20 16:15:29
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for accounts
-- ----------------------------
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `id` char(20) NOT NULL DEFAULT '' COMMENT '用户账号ID',
  `name` char(20) NOT NULL DEFAULT '' COMMENT '用户名称',
  `cash` double precision NOT NULL DEFAULT 0 COMMENT '余额',
  `rate` double precision NOT NULL DEFAULT 0 COMMENT '费率：每分钟通话产生的费用(单位：元)',
  `phone` char(20) NOT NULL DEFAULT '' COMMENT '联系电话',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for sip_users
-- ----------------------------
DROP TABLE IF EXISTS `sip_users`;
CREATE TABLE `sip_users` (
  `caller_id_number` char(20) NOT NULL DEFAULT '' COMMENT 'sip id 号码',
  `caller_id_name` char(20) NOT NULL DEFAULT '' COMMENT 'sip id 名称,可以与号码一样，也可以是名字',
  `password` char(20) NOT NULL DEFAULT '' COMMENT 'sip注册密码',
  `billing_account` char(20) NOT NULL DEFAULT '' COMMENT '关联的计费账号，外呼计费',
  `outbound_caller_id_number` char(20) NOT NULL DEFAULT '' COMMENT '外呼显示号码',
  PRIMARY KEY (`caller_id_number`),
  UNIQUE KEY `caller_id_number` (`caller_id_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for calls
-- ----------------------------
DROP TABLE IF EXISTS `calls`;
CREATE TABLE `calls` (
  `UUID` char(40) NOT NULL DEFAULT '' COMMENT '呼叫 UUID',
  `CalleeIDNumber` char(20) NOT NULL DEFAULT '' COMMENT '被叫方号码',
  `CalleeIDName` char(20) NOT NULL DEFAULT '' COMMENT '被叫方名称',
  `CallerIDNumber` char(20) NOT NULL DEFAULT '' COMMENT '主叫方号码',
  `CallerIDName` char(20) NOT NULL DEFAULT '' COMMENT '主叫方名称',
  `CallState` char(30) NOT NULL DEFAULT '' COMMENT '呼叫状态',
  `AnswerState` char(30) NOT NULL DEFAULT '' COMMENT '应答状态',
  `HangupCause` char(64) NOT NULL DEFAULT '' COMMENT '挂机原因',
  `AnsweredTime` char(20) NOT NULL DEFAULT '' COMMENT '应答时间',
  `HangupTime` char(20) NOT NULL DEFAULT '' COMMENT '挂机时间',
  `CallDuration` int(8) NOT NULL DEFAULT '0' COMMENT '呼叫时长单位秒',
  PRIMARY KEY (`UUID`),
  UNIQUE KEY `UUID` (`UUID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for channels
-- ----------------------------
DROP TABLE IF EXISTS `channels`;
CREATE TABLE `channels` (
  `UniqueID` char(40) NOT NULL DEFAULT '' COMMENT '通道 UniqueID',
  `Name` char(64) NOT NULL DEFAULT '' COMMENT '通道名称',
  `State` char(20) NOT NULL DEFAULT '' COMMENT '通道状态',
  `Direction` char(10) NOT NULL DEFAULT '' COMMENT '通道方向',
  `CodecName` char(16) NOT NULL DEFAULT '' COMMENT '通道编码 （读 + 写）编码',
  `CallerNetworkAddr` char(16) NOT NULL DEFAULT '' COMMENT '通道IP',
  `OtherLegUniqueID` char(40) NOT NULL DEFAULT '' COMMENT '对端通道 UniqueID',
  `OtherLegDirection` char(10) NOT NULL DEFAULT '' COMMENT '对端通道方向',
  `OtherLegChannelName` char(64) NOT NULL DEFAULT '' COMMENT '对端通道名称',
  `OtherLegNetworkAddr` char(16) NOT NULL DEFAULT '' COMMENT '对端通道IP',
  `billing_account` char(16) NOT NULL DEFAULT '' COMMENT '计费账号',
  PRIMARY KEY (`UniqueID`),
  UNIQUE KEY `UniqueID` (`UniqueID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
