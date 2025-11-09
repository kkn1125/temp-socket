import { Header } from "@/components/layout/Header";
import { RoomList } from "@/components/room/RoomList";

export default function RoomsPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <RoomList />
      </div>
    </>
  );
}
