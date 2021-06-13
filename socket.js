// 웹 소켓으로 경매 입찰 상황 메시지를 실시간으로 알림
// 소켓 : 네트워크상에서 서버와 클라이언트 두개의 프로그램이 특정 포트를 통해 양방향 통신이 가능하도록 만들어주는 소프트웨어
const SocketIO = require('socket.io'); // 브라우저와 서버 간의 실시간, 양방향, 이벤트 기반 통신이 가능함

module.exports = (server, app) => {
  const io = SocketIO(server, { path: '/socket.io' }); // 객체 생성
  app.set('io', io); // io 객체 등록
  io.on('connection', (socket) => { // connection이벤트 리스너 연결,  socket과 연결 됐을때
    const req = socket.request; // 소켓의 요청을 변수에 저장
    const { headers: { referer } } = req; // 요청 중 referer(사이트 방문시 남는 흔적)값을 변수에 저장
    const roomId = referer.split('/')[referer.split('/').length - 1]; // referer 값 중 경매방 아이디를 변수에 저장
    socket.join(roomId); // roomId에 입장
    socket.on('disconnect', () => { // disconnection이벤트 리스너 연결, socket과 연결 끊겼을때
      socket.leave(roomId); // roomId에서 나감
    });
  });
};
