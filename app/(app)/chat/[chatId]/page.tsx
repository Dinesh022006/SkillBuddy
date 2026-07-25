import ChatWindow from "./ChatWindow";

export default function ChatPage({ params }: { params: { chatId: string } }) {
  return (
    <div className="flex-1 flex flex-col h-full relative">
      <ChatWindow chatId={params.chatId} />
    </div>
  );
}
