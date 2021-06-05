"use strict"; // js문법 유연하게함
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser'); //요청된 쿠키를 쉽게 추출할 수 있도록 도와주는 미들웨어
const logger = require('morgan'); // 로그 기록
const layouts = require('express-ejs-layouts');
const dotenv = require('dotenv'); // 보안과 편의를 위해 환경변수 파일 관리

const passport = require('passport'); //passport 로그인 관련
var session = require('express-session'); //passport는 내부적으로 session을 사용하기 때문에 기본적인 session 설정

dotenv.config(); // .env 파일로부터 환경변수를 읽어서 process.env로 설정
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const { sequelize, Auction } = require('./models'); // db 연결객체
const app = express();

app.set("port", process.env.PORT || 3000);
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

// session 설정
app.use(session({
    key : 'sid',
    secret :'secret',//세션의 비밀 키, 쿠키값의 변조를 막기 위해서 이 값을 통해 세션을 암호화 하여 저장
    resave : false, // 세션이 수정되지 않아도 항상 저장할지 확인하는 옵션
    saveUninitialized : true, // 세션이 uninitalized 상태로 미리 만들어서 저장하는지 묻는 옵션
    cookie : { // 쿠키에 들어가는 세션 ID값의 옵션
      maxAge : 1000 * 60 * 60, // 60분후 폭파
      httpOnly: true, // https가 아닌 http 만
      secure: false,
    }
  }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.listen(app.get("port"), () => {
    console.log(`Server running at http://localhost:${app.get("port")}`);
  });
  

module.exports = app;
