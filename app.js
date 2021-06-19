"use strict"; // js문법 유연하게함
const express = require('express');
const path = require('path');
const morgan = require('morgan'); // 로그 기록
const cookieParser = require('cookie-parser'); //요청된 쿠키를 쉽게 추출할 수 있도록 도와주는 미들웨어
const session = require('express-session');//passport는 내부적으로 session을 사용하기 때문에 기본적인 session 설정
const passport = require('passport');//passport 로그인 관련
const nunjucks = require('nunjucks'); // HTML 문법, 자바스크립트 문법 사용하는 템플릿 엔진
const dotenv = require('dotenv'); // 보안과 편의를 위해 환경변수 파일 관리

dotenv.config(); // .env 파일로부터 환경변수를 읽어서 process.env로 설정
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const { sequelize } = require('./models'); // db 연결객체
const passportConfig = require('./passport');//passport 폴더사용
const sse = require('./sse'); // 실시간으로 서버 데이터를 구독
const webSocket = require('./socket'); // 브라우저와 서버 간의 실시간, 양방향, 이벤트 기반 통신
const checkAuction = require('./checkAuction');//서버종료로 인한 예외상황처리를 위해 사용(자세한 기능은 checkAuction.js 주석참고)

const app = express();
passportConfig();
checkAuction();//서버실행시 checkAuction 한번 실행
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});
sequelize.sync({ force: false }) // 불러온 db연결 객체에 sync 메서드로 MySQL 연동, {force : true}  서버 실행마다 테이블 재생성
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

// session 설정
const sessionMiddleware = session({
  resave: false,// 세션이 수정되지 않아도 항상 저장할지 확인하는 옵션
  saveUninitialized: false,// 세션이 uninitalized 상태로 미리 만들어서 저장하는지 묻는 옵션
  secret: process.env.COOKIE_SECRET,//세션의 비밀 키, 쿠키값의 변조를 막기 위해서 이 값을 통해 세션을 암호화 하여 저장
  cookie: {// 쿠키에 들어가는 세션 ID값의 옵션
    httpOnly: true,// https가 아닌 http 만
    secure: false,
  },
});

app.use(morgan('dev')); // 요청, 응답 정보를 콘솔에 기록
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

//passport 적용
app.use('/', indexRouter);
app.use('/auth', authRouter);
//app.use(methodOverride('_method'));

//에러 처리문
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

//서버실행
const server = app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});

webSocket(server, app); // 서버와 socket 모듈 연결
sse(server); // 서버와 sse 모듈 연결
