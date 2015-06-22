/*
Navicat MySQL Data Transfer

Source Server         : 111.203.235.200_3306
Source Server Version : 50173
Source Host           : 111.203.235.200:3306
Source Database       : call

Target Server Type    : MYSQL
Target Server Version : 50173
File Encoding         : 65001

Date: 2015-06-22 11:00:34
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for ACCOUNT
-- ----------------------------
DROP TABLE IF EXISTS `ACCOUNT`;
CREATE TABLE `ACCOUNT` (
  `ID` varchar(36) NOT NULL COMMENT 'ID',
  `belongs` varchar(36) DEFAULT NULL COMMENT '所属人',
  `belongsName` varchar(255) DEFAULT NULL COMMENT '所属人名称',
  `cash` double DEFAULT '0' COMMENT '余额',
  `company` varchar(100) NOT NULL COMMENT '公司名',
  `CREATEDATETIME` datetime DEFAULT NULL COMMENT '创建时间',
  `description` longtext COMMENT '描述',
  `disableCause` longtext COMMENT '停用原因',
  `email` varchar(20) NOT NULL COMMENT '联系人邮箱',
  `LOGINNAME` varchar(100) NOT NULL COMMENT '登录名',
  `name` varchar(100) NOT NULL COMMENT '联系人姓名',
  `origin` varchar(255) DEFAULT NULL COMMENT '账号来源 0代理创建1计费创建',
  `password` varchar(50) NOT NULL COMMENT '密码',
  `status` varchar(5) DEFAULT NULL COMMENT '状态 0 新开 1正式2停用',
  `tel` varchar(20) NOT NULL COMMENT '联系人电话',
  `UPDATEDATETIME` datetime DEFAULT NULL COMMENT '更新时间',
  `rate` double DEFAULT '0' COMMENT '费率',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for ACCOUNTCONFIG
-- ----------------------------
DROP TABLE IF EXISTS `ACCOUNTCONFIG`;
CREATE TABLE `ACCOUNTCONFIG` (
  `ID` varchar(36) NOT NULL,
  `CREATEDATETIME` datetime DEFAULT NULL COMMENT '创建时间',
  `day` varchar(20) DEFAULT NULL COMMENT '星期 如：1,2,3,4,5,6,7',
  `endTimeHour` varchar(10) DEFAULT NULL COMMENT '结束小时',
  `endTimeMinute` varchar(10) DEFAULT NULL COMMENT '结束分钟',
  `frontDesk` varchar(20) DEFAULT NULL COMMENT '前台',
  `hotlineNO` varchar(50) DEFAULT NULL COMMENT '热线号码',
  `serviceNO` varchar(100) DEFAULT NULL COMMENT '指定服务号',
  `startTimeHour` varchar(10) DEFAULT NULL COMMENT '开始小时',
  `startTimeMinute` varchar(10) DEFAULT NULL COMMENT '开始分钟',
  `unWorkIvr` varchar(200) DEFAULT NULL COMMENT '下班语音',
  `UPDATEDATETIME` datetime DEFAULT NULL COMMENT '修改时间',
  `welcomeIvr` varchar(200) DEFAULT NULL COMMENT '欢迎语音',
  `workCallFlow` varchar(5) DEFAULT NULL COMMENT '上班电话流程',
  `accountId` varchar(36) NOT NULL COMMENT '公司ID',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for calls
-- ----------------------------
DROP TABLE IF EXISTS `calls`;
CREATE TABLE `calls` (
  `UUID` char(64) NOT NULL DEFAULT '' COMMENT '呼叫 UUID',
  `CallerIDNumber` char(20) NOT NULL DEFAULT '' COMMENT '主叫方号码',
  `CalleeIDNumber` char(20) NOT NULL DEFAULT '' COMMENT '被叫方号码',
  `CallDuration` int(8) NOT NULL DEFAULT '0' COMMENT '呼叫时长单位秒',
  `cost` double NOT NULL DEFAULT '0' COMMENT '产生的费用',
  `AnsweredTime` char(20) NOT NULL DEFAULT '' COMMENT '应答时间',
  `HangupTime` char(20) NOT NULL DEFAULT '' COMMENT '挂机时间',
  `HangupCause` char(64) NOT NULL DEFAULT '' COMMENT '挂机原因',
  `RecordFilePath` char(255) NOT NULL DEFAULT '' COMMENT '录音文件路径',
  `RecordSeconds` int(8) NOT NULL DEFAULT '0' COMMENT '录音时长',
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
  `HangupCause` char(20) NOT NULL DEFAULT '' COMMENT '挂机原因',
  `CreatedTime` char(20) NOT NULL DEFAULT '' COMMENT '通道创建时间',
  `CallerIDName` char(20) NOT NULL DEFAULT '' COMMENT '主叫方名称',
  `CalleeIDName` char(20) NOT NULL DEFAULT '' COMMENT '被叫方名称',
  `Direction` char(10) NOT NULL DEFAULT '' COMMENT '通道方向',
  `CodecName` char(16) NOT NULL DEFAULT '' COMMENT '通道编码 （读 + 写）编码',
  `CallerNetworkAddr` char(16) NOT NULL DEFAULT '' COMMENT '通道IP',
  `OtherLegUniqueID` char(40) NOT NULL DEFAULT '' COMMENT '对端通道 UniqueID',
  `OtherLegDirection` char(10) NOT NULL DEFAULT '' COMMENT '对端通道方向',
  `OtherLegChannelName` char(64) NOT NULL DEFAULT '' COMMENT '对端通道名称',
  `OtherLegNetworkAddr` char(16) NOT NULL DEFAULT '' COMMENT '对端通道IP',
  `billing_account` char(40) NOT NULL DEFAULT '' COMMENT '计费账号',
  `callid` char(64) NOT NULL DEFAULT '' COMMENT '呼叫 UUID',
  PRIMARY KEY (`UniqueID`),
  UNIQUE KEY `UniqueID` (`UniqueID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for employee
-- ----------------------------
DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee` (
  `ID` varchar(36) NOT NULL COMMENT 'ID',
  `CREATEDATETIME` datetime DEFAULT NULL COMMENT '创建时间',
  `email` varchar(50) DEFAULT NULL COMMENT 'email',
  `exten` varchar(20) DEFAULT NULL COMMENT '分机号',
  `isAdmin` varchar(10) DEFAULT NULL COMMENT '管理员0是1否',
  `name` varchar(200) DEFAULT NULL COMMENT '员工姓名',
  `password` varchar(20) DEFAULT NULL COMMENT '密码',
  `sipExten` varchar(100) DEFAULT NULL COMMENT 'sip分机关联',
  `tel` varchar(20) DEFAULT NULL COMMENT '手机号',
  `UPDATEDATETIME` datetime DEFAULT NULL COMMENT '更新时间',
  `account_id` varchar(36) DEFAULT NULL COMMENT '账户信息',
  PRIMARY KEY (`ID`),
  KEY `FK_lsnx7na4u8ohrhoeag7un4wh3` (`account_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for sip_users
-- ----------------------------
DROP TABLE IF EXISTS `sip_users`;
CREATE TABLE `sip_users` (
  `ID` varchar(36) NOT NULL,
  `billing_account` varchar(36) NOT NULL,
  `binding_mobile_number` varchar(20) NOT NULL,
  `binding_work_number` varchar(20) NOT NULL,
  `caller_id_name` varchar(20) NOT NULL,
  `caller_id_number` varchar(36) DEFAULT NULL,
  `password` varchar(20) NOT NULL,
  `realm` varchar(20) NOT NULL,
  `resonance` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYONLINE
-- ----------------------------
DROP TABLE IF EXISTS `SYONLINE`;
CREATE TABLE `SYONLINE` (
  `ID` varchar(36) NOT NULL,
  `CREATEDATETIME` datetime DEFAULT NULL,
  `IP` varchar(100) DEFAULT NULL,
  `LOGINNAME` varchar(100) DEFAULT NULL,
  `TYPE` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYORGANIZATION
-- ----------------------------
DROP TABLE IF EXISTS `SYORGANIZATION`;
CREATE TABLE `SYORGANIZATION` (
  `ID` varchar(36) NOT NULL,
  `ADDRESS` varchar(200) DEFAULT NULL,
  `CODE` varchar(200) DEFAULT NULL,
  `CREATEDATETIME` datetime DEFAULT NULL,
  `ICONCLS` varchar(100) DEFAULT NULL,
  `NAME` varchar(200) DEFAULT NULL,
  `SEQ` int(11) DEFAULT NULL,
  `UPDATEDATETIME` datetime DEFAULT NULL,
  `SYORGANIZATION_ID` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `FK_acf7qlb04quthktalwx8c7q69` (`SYORGANIZATION_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYORGANIZATION_SYRESOURCE
-- ----------------------------
DROP TABLE IF EXISTS `SYORGANIZATION_SYRESOURCE`;
CREATE TABLE `SYORGANIZATION_SYRESOURCE` (
  `SYRESOURCE_ID` varchar(36) NOT NULL,
  `SYORGANIZATION_ID` varchar(36) NOT NULL,
  PRIMARY KEY (`SYORGANIZATION_ID`,`SYRESOURCE_ID`),
  KEY `FK_acpjp8a7fjo0cnn02eb0ia6uf` (`SYORGANIZATION_ID`),
  KEY `FK_m4mfglk7odi78d8pk9pif44vc` (`SYRESOURCE_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYRESOURCE
-- ----------------------------
DROP TABLE IF EXISTS `SYRESOURCE`;
CREATE TABLE `SYRESOURCE` (
  `ID` varchar(36) NOT NULL,
  `CREATEDATETIME` datetime DEFAULT NULL,
  `DESCRIPTION` varchar(200) DEFAULT NULL,
  `ICONCLS` varchar(100) DEFAULT NULL,
  `NAME` varchar(100) NOT NULL,
  `SEQ` int(11) DEFAULT NULL,
  `TARGET` varchar(100) DEFAULT NULL,
  `UPDATEDATETIME` datetime DEFAULT NULL,
  `URL` varchar(200) DEFAULT NULL,
  `SYRESOURCE_ID` varchar(36) DEFAULT NULL,
  `SYRESOURCETYPE_ID` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `FK_n8kk2inhw4y4gax3nra2etfup` (`SYRESOURCE_ID`),
  KEY `FK_93qfpiiuk3rwb32gc5mcmmlgh` (`SYRESOURCETYPE_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYRESOURCETYPE
-- ----------------------------
DROP TABLE IF EXISTS `SYRESOURCETYPE`;
CREATE TABLE `SYRESOURCETYPE` (
  `ID` varchar(36) NOT NULL,
  `CREATEDATETIME` datetime DEFAULT NULL,
  `DESCRIPTION` varchar(200) DEFAULT NULL,
  `NAME` varchar(100) NOT NULL,
  `UPDATEDATETIME` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYROLE
-- ----------------------------
DROP TABLE IF EXISTS `SYROLE`;
CREATE TABLE `SYROLE` (
  `ID` varchar(36) NOT NULL,
  `CREATEDATETIME` datetime DEFAULT NULL,
  `DESCRIPTION` varchar(200) DEFAULT NULL,
  `ICONCLS` varchar(100) DEFAULT NULL,
  `NAME` varchar(100) NOT NULL,
  `SEQ` int(11) DEFAULT NULL,
  `UPDATEDATETIME` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYROLE_SYRESOURCE
-- ----------------------------
DROP TABLE IF EXISTS `SYROLE_SYRESOURCE`;
CREATE TABLE `SYROLE_SYRESOURCE` (
  `SYROLE_ID` varchar(36) NOT NULL,
  `SYRESOURCE_ID` varchar(36) NOT NULL,
  PRIMARY KEY (`SYRESOURCE_ID`,`SYROLE_ID`),
  KEY `FK_kkrartsovl2frhfvriqdi7jwl` (`SYRESOURCE_ID`),
  KEY `FK_r139h669pg4ts6mbvn3ip5472` (`SYROLE_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYUSER
-- ----------------------------
DROP TABLE IF EXISTS `SYUSER`;
CREATE TABLE `SYUSER` (
  `ID` varchar(36) NOT NULL,
  `AGE` int(11) DEFAULT NULL,
  `CREATEDATETIME` datetime DEFAULT NULL,
  `LOGINNAME` varchar(100) NOT NULL,
  `NAME` varchar(100) DEFAULT NULL,
  `PHOTO` varchar(200) DEFAULT NULL,
  `PWD` varchar(100) DEFAULT NULL,
  `SEX` varchar(1) DEFAULT NULL,
  `UPDATEDATETIME` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYUSER_SYORGANIZATION
-- ----------------------------
DROP TABLE IF EXISTS `SYUSER_SYORGANIZATION`;
CREATE TABLE `SYUSER_SYORGANIZATION` (
  `SYUSER_ID` varchar(36) NOT NULL,
  `SYORGANIZATION_ID` varchar(36) NOT NULL,
  PRIMARY KEY (`SYORGANIZATION_ID`,`SYUSER_ID`),
  KEY `FK_14ewqc5wtscac0dd5rswrm5j2` (`SYORGANIZATION_ID`),
  KEY `FK_63bdmtxwlk259id13rp4iryy` (`SYUSER_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for SYUSER_SYROLE
-- ----------------------------
DROP TABLE IF EXISTS `SYUSER_SYROLE`;
CREATE TABLE `SYUSER_SYROLE` (
  `SYUSER_ID` varchar(36) NOT NULL,
  `SYROLE_ID` varchar(36) NOT NULL,
  PRIMARY KEY (`SYROLE_ID`,`SYUSER_ID`),
  KEY `FK_j7iwtgslc2esrjx0ptieleoko` (`SYROLE_ID`),
  KEY `FK_1pi4p5h4y5ghbs5f4gdlgn620` (`SYUSER_ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
