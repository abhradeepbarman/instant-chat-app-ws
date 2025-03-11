import { Copy, MessageCircle } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { ScrollArea } from "./components/ui/scroll-area";

interface ChatMessageType {
    message: string;
    name: string;
    currentUser?: boolean;
}

function App() {
    const [socket, setSocket] = useState<WebSocket | undefined>(undefined);
    const [newRoom, setNewRoom] = useState<string | undefined>();
    const [roomId, setRoomId] = useState<string | undefined>();
    const [name, setName] = useState<string | undefined>();
    const [chatWindow, setChatWindow] = useState<boolean | undefined>(false);
    const [message, setMessage] = useState<string | undefined>();
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [userCount, setUserCount] = useState<number | undefined>(0);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");
        setSocket(ws);

        ws.onmessage = (e) => {
            const { type, payload } = JSON.parse(e.data);
            if (type === "message") {
                setMessages((prev) => [
                    ...prev,
                    {
                        message: payload.message ?? "",
                        name: payload.name ?? "",
                    },
                ]);
            }

            if (type === "error") {
                toast.error(payload.message);
            }

            if (type === "count") {
                const { payload } = JSON.parse(e.data);
                setUserCount(payload.count);
            }
        };
    }, []);

    const createRoom = () => {
        const newRoomId = nanoid(6);
        setNewRoom(newRoomId);
        socket?.send(
            JSON.stringify({
                type: "create",
                payload: { roomId: newRoomId },
            })
        );
    };

    const copyRoomId = () => {
        toast.success("Room code copied to clipboard");
        navigator.clipboard.writeText(newRoom ?? "");
    };

    const joinRoom = () => {
        if (!name) {
            toast.error("Please enter your name");
            return;
        }

        if (!roomId) {
            toast.error("Please enter room code");
            return;
        }

        socket?.send(
            JSON.stringify({
                type: "join",
                payload: { roomId },
            })
        );

        setChatWindow(true);
    };

    const sendMessage = () => {
        socket?.send(
            JSON.stringify({
                type: "message",
                payload: { message, name, roomId },
            })
        );
        setMessages((prev) => [
            ...prev,
            { message: message ?? "", name: name ?? "", currentUser: true },
        ]);
        setMessage("");
    };

    return (
        <div className="h-screen flex items-center justify-center">
            <div className="border border-gray-500 p-5 rounded-xl flex flex-col gap-5">
                <div>
                    <h1 className="flex gap-2 text-3xl items-center">
                        <MessageCircle size={28} /> Real Time Chat
                    </h1>
                    <p>temporary room that expires after all users exit</p>
                </div>
                {!chatWindow ? (
                    <div className=" flex flex-col gap-3">
                        <Button className="w-full" onClick={createRoom}>
                            Create New Room
                        </Button>

                        <div className="flex flex-col gap-3">
                            <Input
                                placeholder="Enter your name"
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter Room code"
                                    onChange={(e) => setRoomId(e.target.value)}
                                    value={roomId}
                                />
                                <Button onClick={joinRoom}>Join Room</Button>
                            </div>
                        </div>

                        {newRoom && (
                            <div className="flex items-center justify-center flex-col p-5 bg-gray-800 rounded-xl gap-2">
                                <p>Share this code with your friend</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-3xl font-semibold">
                                        {newRoom}
                                    </p>
                                    <span
                                        className="cursor-pointer"
                                        onClick={copyRoomId}
                                    >
                                        <Copy />
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-[70vh] w-xl flex flex-col gap-3">
                        <div className="flex justify-between bg-gray-900 px-3 py-2 rounded-xl">
                            <div className="flex gap-3 items-center">
                                <p>Room Code: {roomId}</p>
                                <span
                                    className="cursor-pointer"
                                    onClick={copyRoomId}
                                >
                                    <Copy size={18} />
                                </span>
                            </div>

                            <div>Users:{userCount}</div>
                        </div>

                        <ScrollArea className="w-full mt-2 flex-auto h-[400px] border-2 rounded-xl px-5 py-2">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`my-3 w-full flex flex-col  ${
                                        message?.currentUser
                                            ? "items-end"
                                            : "items-start"
                                    }`}
                                >
                                    <p className="text-sm text-gray-500">
                                        {message.name}
                                    </p>
                                    <p
                                        className={` px-2 py-2 w-fit rounded-lg mt-1 ${
                                            message?.currentUser
                                                ? "bg-white text-black"
                                                : "bg-gray-800"
                                        }`}
                                    >
                                        {message.message}
                                    </p>
                                </div>
                            ))}
                        </ScrollArea>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a message ..."
                                onChange={(e) => setMessage(e.target.value)}
                                value={message}
                            />
                            <Button onClick={sendMessage}>Send</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
