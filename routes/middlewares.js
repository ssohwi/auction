exports.isLoggedIn = (req, res, next) => { //로그인 상태
  if (req.isAuthenticated()) { //isAuthenticated는 passport에서 제공 (권한 체크) 로그인 인증이됬다면 next() 실행
    next();
  } else { //로그인 인증이 되지않았다면 redirect 및 에러메세지 출력
    res.redirect('/?loginError=로그인이 필요합니다.');
  }
};

exports.isNotLoggedIn = (req, res, next) => { //로그인 상태가 아닐경우
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};