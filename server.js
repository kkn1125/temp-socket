const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const {
  initializeDB,
  addChatMessage,
  addParticipant,
  removeParticipant,
  getRoom,
  markMessagesAsRead,
  getUser,
} = require("./lib/db");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  // Socket.io 서버 설정
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // DB 초기화
  initializeDB().catch((err) => {
    console.error("Failed to initialize database:", err);
  });

  // 소켓별 참여한 방 추적
  const socketRooms = new Map(); // socket.id -> Set of roomIds
  const socketNicknames = new Map(); // socket.id -> nickname

  // Socket.io 이벤트 처리
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socketRooms.set(socket.id, new Set());

    socket.on("join-room", async ({ roomId, userId, isReconnect }) => {
      const userRooms = socketRooms.get(socket.id);

      // User 정보 가져오기
      const user = await getUser(userId);
      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }

      // 닉네임 저장
      socketNicknames.set(socket.id, user.nickname);
      socket.data.nickname = user.nickname;
      socket.data.userId = userId;

      // 이미 참여한 방인지 확인
      const isNewJoin = !userRooms.has(roomId);

      // 이미 참여한 방이면 카운트 증가 안 함
      if (isNewJoin) {
      socket.join(roomId);
        userRooms.add(roomId);
        console.log(`${user.nickname} joined room ${roomId}`);
      
        // Participant 테이블에 추가
        await addParticipant(roomId, userId);

        // 방에 참여했을 때 읽음 처리 (새로 참여한 경우)
        await markMessagesAsRead(roomId, user.nickname);
      }

      const room = await getRoom(roomId);
      
      // 룸 업데이트 이벤트 전송
      if (room) {
        io.to(roomId).emit("room-update", {
          roomId,
          participantCount: room.participantCount,
        });
      }
    });

    socket.on("leave-room", async ({ roomId }) => {
      const userRooms = socketRooms.get(socket.id);
      const userId = socket.data.userId;

      // 참여한 방이면 카운트 감소
      if (userRooms.has(roomId) && userId) {
      socket.leave(roomId);
        userRooms.delete(roomId);
      console.log(`Client left room ${roomId}`);
      
        // Participant 테이블에서 제거
        // await removeParticipant(roomId, userId);
      const room = await getRoom(roomId);
      
      // 룸 업데이트 이벤트 전송
      if (room) {
          io.to(roomId).emit("room-update", {
            roomId,
            participantCount: room.participantCount,
          });
        }
      }
    });

    socket.on("send-message", async ({ roomId, userId, message }) => {
      // User 정보 가져오기
      const user = await getUser(userId);
      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }

      // 방에 있는 모든 소켓 확인
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const hasOtherUsers = socketsInRoom.length > 1; // 본인 외에 다른 사람이 있으면

      const chatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        roomId,
        nickname: user.nickname,
        message,
        timestamp: Date.now(),
        isRead: hasOtherUsers, // 방에 다른 사람이 있으면 읽음
      };

      await addChatMessage(chatMessage);

      // 방에 있는 모든 사용자에게 읽음 처리
      if (hasOtherUsers) {
        // 방에 있는 모든 사용자의 닉네임 목록
        const nicknamesInRoom = socketsInRoom
          .map((s) => s.data?.nickname || socketNicknames.get(s.id))
          .filter((n) => n && n !== user.nickname);

        // 각 사용자에 대해 읽음 처리
        for (const userNickname of nicknamesInRoom) {
          await markMessagesAsRead(roomId, userNickname);
        }
      }
      
      // 룸의 모든 클라이언트에게 메시지 전송
      io.to(roomId).emit("receive-message", chatMessage);
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);

      // 소켓이 참여한 모든 방에서 나가기 처리
      const userRooms = socketRooms.get(socket.id);
      const userId = socket.data.userId;
      if (userRooms && userId) {
        for (const roomId of userRooms) {
          // await removeParticipant(roomId, userId);
          const room = await getRoom(roomId);
          if (room) {
            io.to(roomId).emit("room-update", {
              roomId,
              participantCount: room.participantCount,
            });
          }
        }
        socketRooms.delete(socket.id);
        socketNicknames.delete(socket.id);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
