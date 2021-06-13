// 서버센트 이벤트를 사용해 서버 시간을 받아온 후 경매 시간을 관리
const SSE = require('sse'); // 서버가 http를 통해 데이터를 웹페이지로 푸시할 수 있도록 함

module.exports = (server, app) => {
  const sse = new SSE(server); // sse객체 생성
  sse.on('connection', (client) => { // connection이벤트 리스너 연결 , client와 연결 됐을때
    setInterval(() => { // 일정한 시간 간격으로 작업을 수행
      client.send(Date.now().toString());  // 서버 날짜와시간을 client에게 전송, 문자열만 보낼 수 있음
    }, 1000); // 1초마다 반복
  });
};