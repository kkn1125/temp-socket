import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Socket.io는 서버리스 함수에서 직접 지원되지 않으므로
// 별도의 서버가 필요합니다.
// 이 파일은 참고용이며, 실제로는 별도 서버에서 Socket.io를 실행해야 합니다.

export async function GET(request: NextRequest) {
  return new Response('Socket.io server is not available in serverless functions', {
    status: 501,
  });
}

