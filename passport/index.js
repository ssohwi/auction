const passport = require('passport');

const local = require('./localStrategy');
const User = require('../models/user');

module.exports = () => {
  passport.serializeUser((user, done) => {//로그인 성공 시 콜백 함수 호출
    done(null, user.id);//로그인한 사용자의 식별 값을 session store에 user.id로 저장
  });

  //로그인한 사용자인지 아닌지 체크하기 위해 사용
  passport.deserializeUser((id, done) => { // 로그인 성공한 사용자가 웹 페이지 이동할 때 마다 콜백 함수 호출
    User.findOne({ where: { id } }) //user db에서 id값 검색
      .then(user => done(null, user)) //존재하면 user 인자값을 호출해준다.(user의 정보들 email,nick,money등)
      .catch(err => done(err)); //에러발생시 에러처리함수호출
  });

  local(); //passport의 LocalStrategy 실행
};
