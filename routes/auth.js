const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');//비밀번호 암호화를 위해 사용

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');//passport의 isAuthenticated를 통해 로그인인증을 하기위해 사용
const User = require('../models/user');//model에 user db를 사용하기위해 사용

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user; //모든 템플릿에 사용자 정보를 변수로 집어넣어 res.render메소드에 user: req.user 를 사용하지않아도 중복제거가능
  next();
});

//회원가입
//async await 패턴은 비동기식 프로그램을 일반적인 동기 프로그램과 유사한 방식으로 구성 할 수 있도록 많은 프로그래밍 언어에서 지원하고 있는 기능 , non-blocking
//비동기 코드의 겉모습과 동작을 좀 더 동기 코드와 유사하게 만들어준다
router.post('/join', isNotLoggedIn, async (req, res, next) => {//async함수는 promise 리턴(promise:내부적인 예외처리구조기능을가짐)
  const { email, nick, password, money } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } }); //await을 만나면 함수의 실행을 일시중지(db에서 email정보 찾을때까지 잠시중지)
    if (exUser) {//회원인 경우
      return res.redirect('/join?joinError=이미 가입된 이메일입니다.');
    }
    const hash = await bcrypt.hash(password, 12);//비밀번호 암호화를 위해 bcrypt를 사용(10~13 사이의 숫자가있는데 높을수록 보안이 강해짐 )
    await User.create({//db에 입력한 값을 추가
      email,
      nick,
      password: hash,//비밀번호엔 암호화된 값을 넣어줌
      money,
    });
    res.send('<script>alert("회원가입 성공");\
    location.href="/";</script>');
  } catch (error) {//에러 처리문
    console.error(error);
    return next(error);
  }
});

//로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {
    //미들웨어
    //authenticate 첫번째 인자로 local을 사용한이유는 사용자의 아이디,비밀번호를 사용해 로그인 인증을 하기 위함
  passport.authenticate('local', (authError, user, info) => {//로그인 폼에서 제출버튼을 누르면 이 라인을 먼저 만나게되는데 passport에 localstrategy를 실행하게된다.
    if (authError) {//인증오류
      console.error(authError);
      return next(authError);
    }
    if (!user) {//회원이 아닐경우 (user는 localStrategy에 exUser인자값)
      return res.redirect(`/?loginError=${info.message}`);//메인화면으로 redirect 및 로그인오류메세지 출력
    }
    return req.login(user, (loginError) => {
      if (loginError) {//로그인 오류
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);
});


//회원정보 상세보기
router.get('/detail',(req,res,next)=>{
  res.render('users/detail')
})

//회원 정보 수정 페이지로 이동
router.get('/update',(req,res,next)=>{
  res.render('users/update')
})

//회원정보수정 get방식
router.get('/update/:id',(req,res,next)=>{
  var id = req.params.id
  User.findOne({ //db에 user테이블에서 id값을 찾는다.
    id
  }).then((user)=>{ //존재한다면 
    res.render('users/update') //update.html 렌더링
  })
});

//회원정보수정 post방식
router.post('/update/:id',async(req,res,next)=>{ // async함수는 promise 리턴(promise:내부적인 예외처리구조기능을가짐)
  try{
    var id = req.params.id 
    const hashedPassword = await bcrypt.hash(req.body.password,12); //입력한 비밀번호를 암호화하기위해 bcrypt.hash 를 사용한다.
     const user = await User.update({ //db user테이블에 아래 입력한 데이터로 정보를 수정한다. 
      nick: req.body.nick, //update는 변경할값 , where 순으로 사용
      password:hashedPassword, 
      money:req.body.money,
    },{where:{id}})
   
    if(!user){ //회원이 아닐경우
      return res.status(200).send({status:404},{message:'No data found'}); //에러메세지출력
    }
    return res.send('<script>alert("회원정보수정 완료");location.href="/auth/detail";</script>')  
  } catch(error){
    console.log(error);
    next(error);
  }

})
  //회원탈퇴
  router.get('/login/delete/:email',async(req,res,next)=>{
    try{
        var email = req.params.email; 
        const user = await User.destroy({ //db user테이블에서 where에 해당하는 열 삭제
          where : {
            email
          }
        });
        if(user){ //DB에 존재할경우
          res.send('<script>alert("회원탈퇴 완료");location.href="/";</script>')    
        }
      }
    catch(error){
      console.log(error);
      next(error);
    }
  });

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
