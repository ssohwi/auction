const Sequelize = require('sequelize'); // 모델과 MySQL 테이블을 연결

module.exports = class User extends Sequelize.Model { // Model : static init과 static associate으로 나뉨
    static init(sequelize) { // static init : 테이블에 대한 설정
        return super.init({ // super.init의 첫번째 인수 : 테이블 컬럼 설정
            id : {
                type: Sequelize.INTEGER,
                autoIncrement:true,
                primaryKey:true
            },
            // 이메일
            email: {
                type: Sequelize.STRING(40),
                allowNull: false,
                unique: true,
            },
            // 이름
            name: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            // 비밀번호
            password: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            // 보유 자금
            money: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        }, { // super.init의 두번째 인수 : 테이블 설정
            sequelize, // model/index.js의 db.sequelize 객체
            timestamps: true, // createAt, updateAt컬럼 생성, 로우 생성및 수정시 시간 기록
            paranoid: true, // deleteAt컬럼 생성, 로우 삭제시 완전히 지워지지 않고 시간 기록
            modelName: 'User', // 노드 모델 이름
            tableName: 'users', // 실제 db 테이블 이름
            charset: 'utf8', // 한글을 위한 문자 설정
            collate: 'utf8_general_ci', // 한글을 위한 문자 설정
        });
    }

    static associate(db) { // static associate : 다른 테이블과의 관계
        db.User.hasMany(db.Auction); // users 테이블 로우를 불러올 때 연결된 auctions 테이블의 로우들을 불러옴
    }
};