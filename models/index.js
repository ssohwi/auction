"use strict";

const Sequelize = require('sequelize'); // 자바스크립트 문구를 SQL로 바꿔줌
const User = require('./user');//model user.js 연결
const Good = require('./good');//model good.js 연결
const Auction = require('./auction');//model auction.js 연결

const env = process.env.NODE_ENV || 'development';//config.json의 개발용을 사용함.
const config = require('../config/config')[env];  // config/config.json에서 데이터베이스 설정 불러옴
const db = {};

const sequelize = new Sequelize( // MySQL 연결 객체 생성
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize; // 연결객체를 db에 담기
db.User = User; // db 객체에 User 담기
db.Good = Good; // db 객체에 Good 담기
db.Auction = Auction; // db 객체에 Auction 담기

User.init(sequelize); // 테이블과 모델의 연결을 위해 User 모델의 static init 메서드 호출
Good.init(sequelize); // 테이블과 모델의 연결을 위해 Good 모델의 static init 메서드 호출
Auction.init(sequelize); // 테이블과 모델의 연결을 위해 Auction 모델의 static init 메서드 호출

User.associate(db); // 다른 테이블과 관계를 연결하기 위해 User 모델의 static associate 메서드 호출
Good.associate(db); // 다른 테이블과 관계를 연결하기 위해 Good 모델의 static associate 메서드 호출
Auction.associate(db); // 다른 테이블과 관계를 연결하기 위해 Auction 모델의 static associate 메서드 호출

module.exports = db;
