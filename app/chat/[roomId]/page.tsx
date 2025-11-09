import { notFound } from "next/navigation";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { getRoom, getChatMessages } from "@/lib/db";
import { ChatMessage } from "@/types";

interface ChatPageProps {
  params: { roomId: string };
}

async function getRoomData(roomId: string) {
  try {
    return await getRoom(roomId);
  } catch (error: any) {
    return null;
  }
}

async function getMessages(roomId: string): Promise<ChatMessage[]> {
  try {
    return await getChatMessages(roomId);
  } catch (error: any) {
    return [];
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { roomId } = await params;
  const room = await getRoomData(roomId);

  if (!room) {
    notFound();
  }

  const messages = await getMessages(roomId);

  return (
    <div className="h-screen">
      <ChatRoom room={room} initialMessages={messages} />
    </div>
  );
}
