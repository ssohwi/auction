//chechAuction.js는 서버 시작 시 실행되는 함수로 제한시간이 지나고 낙찰자가 정해지지 않은 상품에 대해 낙찰자를 정해준다. 

const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');

module.exports = async () => {
  console.log('checkAuction');
  try {
    const yesterday = new Date(); //현재 날짜
    //yesterday.setDate(yesterday.getDate() - 1); // //getDate는 현재 일을 반환해줌(1~31)
    //-1을 함으로 상품등록 후 24시간 전 날짜로 설정
    yesterday.setMinutes(yesterday.getMinutes()-1);
    const targets = await Good.findAll({//SoldID값이 null값이고(낙찰자가 없고), 24시간이 지난(경매가 만료된) 모든 상품을 검색
      where: {
        SoldId: null,
        createdAt: { [Op.lte]: yesterday },
      },
    });
    targets.forEach(async (target) => {//경매가 진행되었지만 서버종료로 낙찰자가 정해지지 않은 상품에 대해 낙찰자를 지정해준다.
      const success = await Auction.findOne({
        where: { GoodId: target.id },
        order: [['bid', 'DESC']],
      });
      if (success){//낙찰자가 있으면
      await Good.update({ SoldId: success.UserId }, { where: { id: target.id } });//낙찰자의 ID를 SoIdId에 업데이트
      await User.update({
        money: sequelize.literal(`money - ${success.bid}`),//낙찰자의 보유자산에서 낙찰 금액을 차감
      }, {
        where: { id: success.UserId },
      });
    }else{//낙찰자가 없으면 목록에서 삭제
      await Good.destroy({where: {id:target.id}});
    }
    });
  } catch (error) {//에러처리
    console.error(error);
  }
};
