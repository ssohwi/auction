const Sequelize = require('sequelize'); // 모델과 MySQL 테이블을 연결

module.exports = class Product extends Sequelize.Model { // Model : static init과 static associate으로 나뉨
    static init(sequelize) { // static init : 테이블에 대한 설정
        return super.init({ // super.init의 첫번째 인수 : 테이블 컬럼 설정
            // 상품명
            name: {
                type: Sequelize.STRING(40),
                allowNull: false,
            },
            // 상품 사진
            img: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },
            // 상품 시작 가격
            price: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        }, { // super.init의 두번째 인수 : 테이블 설정
            sequelize, // model/index.js의 db.sequelize 객체
            timestamps: true, // createAt, updateAt컬럼 생성, 로우 생성및 수정시 시간 기록
            paranoid: true, // deleteAt컬럼 생성, 로우 삭제시 완전히 지워지지 않고 시간 기록
            modelName: 'Product', // 노드 모델 이름
            tableName: 'products', // 실제 db 테이블 이름
            charset: 'utf8', // 한글을 위한 문자 설정
            collate: 'utf8_general_ci', // 한글을 위한 문자 설정
        });
    }

    static associate(db) { // static associate : 다른 테이블과의 관계
        // belongsTo, hasMany : 테이블의 로우 불러올때 연결된 테이블의 로우들을 가져옴
        // 다른 모델의 정보가 들어가는 테이블은 belongsTo를 사용
        db.Product.belongsTo(db.User, { as: 'Owner' }); // 등록한 유저, OwnerId컬럼 생성
        db.Product.belongsTo(db.User, { as: 'Sold' }); // 낙찰받은 유저, SoldId컬럼으로 생성
        db.Product.hasMany(db.Auction);
    }
};