var express = require('express');
var router = express.Router();
var User = require('../models/user');
const bcrypt = require('bcrypt');

/* GET users listing. */


router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login',(req,res)=>{
  res.render('users/login');
})


//async await 패턴은 비동기식 프로그램을 일반적인 동기 프로그램과 유사한 방식으로 구성 할 수 있도록 많은 프로그래밍 언어에서 지원하고 있는 기능 , non-blocking
//비동기 코드의 겉모습과 동작을 좀 더 동기 코드와 유사하게 만들어준다
router.post('/login',async(req,res,next)=>{ // async함수는 promise 리턴(promise:내부적인 예외처리구조기능을가짐)
  try{
      let body = req.body;

      let result = await User.findOne({ // await을 만나면 함수의 실행을 일시중지(db에서 email정보 찾을때까지 잠시중지)
          where: {
              email : body.email
          }
      });

      let dbPassword = result.dataValues.password;
      let inputPassword = body.password;
      const Password = await bcrypt.compare(inputPassword,dbPassword); //현재 비밀번호,DB에 담겨있는 비밀번호 일치하는지확인
      
      if(Password){
          console.log("비밀번호 일치");
          // 세션 설정
          req.session.logined = true;
          req.session.email = body.email;
          res.render('./users/logout',{email : req.session.email})
          // res.send('<script>alert("로그인 성공");\
          // location.href="/";</script>');
      }
       else{
          console.log("비밀번호 불일치");
        }
        res.redirect("/users/login");  
      }catch(error){ //에러 발생할경우
        console.log(error);
        res.status(403).send('<script>alert("회원탈퇴한 아이디 입니다.");location.href="/users/login";</script>'); //회원탈퇴한 아이디로 로그인시도할경우
         next(error)
     }
});


//회원가입
router.get('/join',(req,res,next)=>{
  res.render('users/join');
})

router.post('/join',async(req,res,next)=>{
    try {
      const user = await User.findOne({
        where : {
          email: req.body.email
        }
      });
      if(user){
         res.status(403).send('<script>alert("이미 사용중인 아이디 입니다.");location.href="/users/join";</script>');
         
      }
      const hashedPassword = await bcrypt.hash(req.body.password,12); //비밀번호 암호화를 위해 bcrypt를 사용(10~13 사이의 숫자가있는데 높을수록 보안이 강해짐 )
      await User.create({
           password:hashedPassword,
           phone:req.body.phone,
           name:req.body.name,
           email:req.body.email
      });
      res.send('<script>alert("회원가입 성공");\
        location.href="/users/login";</script>');
      
    }
    catch(error){ //에러처리문
      console.log(error);
      res.status(403).send('<script>alert("회원탈퇴한 아이디 입니다.");location.href="/users/join";</script>'); //회원가입시 회원탈퇴한 아이디로 가입시도하는경우
      next(error)
    };
  });

  //회원탈퇴
router.get('/login/delete/:email',async(req,res,next)=>{
  try{
      var email = req.params.email;
      const user = await User.destroy({
        where : {
          email
        }
      });
      if(user){
        res.send('<script>alert("회원탈퇴 완료");location.href="/users/login";</script>')    
      }
  }
  catch(error){
    console.log(error);
    next(error);
  }
});


//로그아웃할경우 로그인화면으로 전환
router.post('/logout',(req,res)=>{
  req.logOut();
  req.session.destroy(); //세션 삭제
  res.clearCookie('sid'); //쿠키삭제
  res.redirect('/users/login');
})

module.exports = router;
