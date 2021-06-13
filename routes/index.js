"use strict"; // js문법 유연하게함
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');//특정시점에 이벤트를 발생하기 위해 node-schedule 사용

const { Good, Auction, User } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user; // user 정보를 view 템플릿에서 사용할 수 있도록 변수로 할당
  next(); // 다음 미들웨어로 이동
});


// 메인화면으로 이동
router.get('/', async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { SoldId: null } });//SoldId가 null 이란것은 낙찰자가 없다면
    res.render('main', { //  main.html를 렌더링
      title: '누가살래?', // title을 view 템플릿에서 변수값으로 사용할 수 있도록 할당
      goods, // 상품들의 정보를 view 템플릿의 변수값으로 사용할 수 있도록 할당
    });
  } catch (error) { // 에러 핸들링
    console.error(error);
    next(error);
  }
});

//로고클릭시 메인화면 이동
router.get('/main', async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { SoldId: null } });
    res.render('main', { //  main.html를 렌더링
      title: '누가살래?', // title을 view 템플릿에서 변수값으로 사용할 수 있도록 할당
      goods, // 상품들의 정보를 view 템플릿의 변수값으로 사용할 수 있도록 할당
    });
  } catch (error) { // 에러 핸들링
    console.error(error);
    next(error);
  }
});

// 로그인 화면으로 이동
router.get('/login', isNotLoggedIn, (req, res) => { // isNotLoggedIn : 로그인 되어있지 않다면
  res.render('users/login', {
    title: 'LOGIN | 누가살래 ? ', // title을 view 템플릿 변수값으로 사용할 수 있도록 할당하고 join.html을 렌더링 
  });
});

// 회원가입 화면으로 이동
router.get('/join', isNotLoggedIn, (req, res) => { // isNotLoggedIn : 로그인 되어있지 않다면
  res.render('users/join', {
    title: 'SIGNUP | 누가살래?', // title을 view 템플릿 변수값으로 사용할 수 있도록 할당하고 join.html을 렌더링 
  });
});

// 상품 등록 화면으로 이동
router.get('/good', isLoggedIn, (req, res) => { // isLoggedIn : 로그인 된 상태라면
  res.render('good', { title: '상품 등록 | 누가살래?' }); // title을 view 템플릿 변수값으로 사용할 수 있도록 할당하고 good.html을 렌더링 
});

// 상품 이미지를 업로드 하는 uploads 디렉토리 폴더 관리
try {
  fs.readdirSync('uploads'); // uploads 디렉토리가 있는지 확인
} catch (error) {
  console.error('uploads 폴더가 존재하지 않습니다. uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads'); // uploads 디렉토리가 없는 경우 생성
}

// 상품 이미지 업로드할 때 사용하는 multer 미들웨어
const upload = multer({
  storage: multer.diskStorage({ // storage : 파일 저장 위치, diskStorage : 파일을 저장하기 위한 모든걸 컨트롤
    destination(req, file, cb) {
      cb(null, 'uploads/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname); // 확장자를 제외한 파일이름을 변수에 저장 
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext); // cb 콜백함수를 통해 전송된 파일 이름을 날짜+파일이름으로 변경하여 저장
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // limits : 업로드된 데이터의 한도, fileSize : 파일 크기
});

// 상품 등록 정보 저장
router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => { // upload.single('photo') : input에 입력된 하나의 이미지, photo는 input 의 name 
  try {
    const { name, price } = req.body; // 입력된 내용에서 name과 price를 넣음
    await Good.create({ // 입력된 상품 정보를 비동기 방식으로 저장
      OwnerId: req.user.id, // 상품 등록자를 사용자의 id로 저장
      name, // 상품이름
      img: req.file.filename, // 업로드 된 파일 이름
      price, // 상품 가격
    });
    const end = new Date();//현재 날짜
    //end.setDate(end.getDate()+1); //getDate는 현재 일을 반환해줌(1~31)
    //+1을 함으로 상품등록 후 24시간 뒤 날짜로 설정
    end.setMinutes(end.getMinutes()+1);
    //경매 24시간이 지난후 낙찰자 선정
    schedule.scheduleJob(end, async () => {//end, 즉 하루가 지나면 함수 실행
      const success = await Auction.findOne({//가장 높은 가격을 제시한 사람을 find
        where: { GoodId: good.id }, //상품 번호 조회
        order: [['bid', 'DESC']], //금액을 내림차순으로 조회(제일 높은 가격 탐색)
      });
      if (success){//낙찰자가 있으면
        await Good.update({ SoldId: success.UserId }, { where: { id: good.id } });//낙찰자의 ID를 SoIdId에 업데이트
        await User.update({
          money: sequelize.literal(`money - ${success.bid}`),//낙찰자의 보유자산에서 낙찰 금액을 차감
        }, {
          where: { id: success.UserId },
        });
      }else{//낙찰자가 없으면 목록에서 삭제
        await Good.destroy({where: {id:good.id}});
      }
    });
    res.redirect('/'); // main.html로 이동
  } catch (error) { // 에러 핸들링
    console.error(error);
    next(error);
  }
});

//낙찰내역 조회
router.get('/list', isLoggedIn, async (req, res, next) => {
  try {
    const goods = await Good.findAll({//요청된 id의 사용자가 낙찰받은 모든 물품을 조회
      where: { SoldId: req.user.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    res.render('list', { title: '낙찰 목록 - NodeAuction', goods });//goods정보를 list.html에 렌더링
  } catch (error) {//에러처리
    console.error(error);
    next(error);
  }
});

// 상품 페이지
router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  try {
    const [good, auction] = await Promise.all([
      Good.findOne({ // 상품 테이블에서 하나의 데이터를 검색
        where: { id: req.params.id }, // 요청된 id와 같은 id를 검색
        include: { // Owner(User 모델)이 포함된 데이터를 검색
          model: User,
          as: 'Owner', // User 모델이 사용된 Owner, Sole 중 Owner만 포함
        },
      }),
      Auction.findAll({ // 경매 테이블에서 모든 데이터를 검색
        where: { GoodId: req.params.id }, // 요청된 id와 같은 상품id를 검색
        include: { model: User }, // User 모델이 포함된 데이터를 검색
        order: [['bid', 'ASC']], // bid(입찰가)를 오름차순으로 정렬
      }),
    ]);
    res.render('auction', {
      title: `${good.name} - 누가살래?`, // title을 view 템플릿 변수값으로 사용할 수 있도록 할당하고 auction.html을 렌더링 
      good, // 상품 정보
      auction, // 경매 정보
    });
  } catch (error) { // 에러 핸들링
    console.error(error);
    next(error);
  }
});

// 상품 입찰 정보 저장
router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  try {
    const { bid, msg } = req.body; // 요청 body에서 입력된 bid와 msg를 변수로 저장
    const good = await Good.findOne({ // 상품 테이블에서 하나의 데이터를 검색
      where: { id: req.params.id }, // 요청된 id와 같은 id를 검색
      include: { model: Auction }, // Auction 모델이 포함된 데이터를 검색
      order: [[{ model: Auction }, 'bid', 'DESC']], // Auction 모델의 bid 컬럼을 기준으로 내림차순 정렬
    });
    if (good.price >= bid) { // 입찰가가 시작입찰가보다 낮거나 같은 경우
      return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
    }
    if (new Date(good.createdAt).valueOf() + (24 * 60 * 60 * 1000) < new Date()) { // 상품등록 날짜+하루 보다 현재 날짜가 큰 경우
      return res.status(403).send('경매가 이미 종료되었습니다');
    }
    if (good.Auctions[0] && good.Auctions[0].bid >= bid) { // 상품의 가장 높은 경매 입찰가보다 입력된 입찰가가 작거나 같은 경우
      return res.status(403).send('이전 입찰가보다 높아야 합니다');
    }
    if (good.OwnerId == req.user.id) {
      return res.status(403).send('경매 등록자는 입찰할 수 없습니다.');
    }
    // 입찰 정보 저장
    const result = await Auction.create({
      bid, // 입찰 가격
      msg, // 입찰 메시지
      UserId: req.user.id, // 사용자 아이디
      GoodId: req.params.id, // 상품 아이디
    });

    // 실시간으로 입찰 내역 전송
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid, // 입찰 가격
      msg: result.msg, // 입찰 메시지
      nick: req.user.nick, // 사용자 이름
    });
    return res.send('ok');
  } catch (error) { // 에러 핸들링
    console.error(error);
    return next(error);
  }
});

module.exports = router;
