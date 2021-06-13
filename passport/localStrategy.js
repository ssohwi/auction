const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email', //layout.html의 form에 해당하는 email값
    passwordField: 'password', //layout.html의 form에 해당하는 비밀번호값
  }, async (email, password, done) => { //아이디, 비밀번호 불일치 확인
    try {
      const exUser = await User.findOne({ where: { email } }); // await를 만나면 함수의 실행을 일시중지( db에 user 테이블에서 email값을 찾을때까지 잠시 중지) 
      if (exUser) { //db조회결과 회원인경우
        const result = await bcrypt.compare(password, exUser.password); //로그인 폼에서 입력한 비밀번호와 db에 저장된 암호화된 비밀번호를 비교하기위해 사용(bcrypt.compare을 사용하지않을경우 로그인폼에서 비밀번호를 일치하게 입력해도 db엔 암호화된상태로 저장되있어 오류발생)
        if (result) { //비밀번호가 일치할경우
          done(null, exUser); //exUser의 값을 passport index에 passport.serializeUser의 첫번째 인자로 전송후 로그인을 완료시킨다.
        } else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' }); //비밀번호가 일치하지않을경우 redirect (message)
        }
      } else {
        done(null, false, { message: '가입되지 않은 회원입니다.' }); //user db에 존재하지않는 email인경우
      }
    } catch (error) { //에러 처리문
      console.error(error);
      done(error);
    }
  }));
};

