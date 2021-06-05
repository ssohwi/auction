"use strict"; // js문법 유연하게함
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan'); // 로그 기록
const layouts = require('express-ejs-layouts');
const dotenv = require('dotenv'); // 보안과 편의를 위해 환경변수 파일 관리`


dotenv.config(); // .env 파일로부터 환경변수를 읽어서 process.env로 설정
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const { sequelize } = require('./models'); // db 연결객체
const app = express();

app.set("view engine", "ejs");
app.set('views', './views');

sequelize.sync({ force: false }) // 불러온 db연결 객체에 sync 메서드로 MySQL 연동, {force : true}  서버 실행마다 테이블 재생성
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    })

app.use(logger('dev')); // 요청, 응답 정보를 콘솔에 기록
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
