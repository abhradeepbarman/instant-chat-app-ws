import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface ChatSocket {
    socket: WebSocket;
    roomId: string;
}

let chatSockets: ChatSocket[] = [];
// [{
//     socket,
//     roomId
// }]

wss.on("connection", function connection(socket) {
    console.log("user connected");

    socket.on("message", (data) => {
        const { type, payload } = JSON.parse(data.toString());

        if (type === "join") {
            const { roomId } = payload;

            // delete all previous chatSockets
            chatSockets = chatSockets.filter((cs) => cs.socket !== socket);

            // connect new chat socket
            chatSockets.push({
                socket,
                roomId,
            });
        }

        if (type === "message") {
            const { message, name } = payload;

            // get roomID
            const chatSocket = chatSockets.find((cs) => cs.socket === socket);
            const roomID = chatSocket?.roomId;

            // send Message to all other connected chat sockets except myself
            chatSockets
                ?.filter(
                    (cs) =>
                        cs.roomId === roomID && cs.socket !== chatSocket?.socket
                )
                ?.forEach((cs) =>
                    cs.socket.send(
                        JSON.stringify({
                            type: "message",
                            payload: { message, name },
                        })
                    )
                );
        }
    });

    socket.on("close", () => {
        chatSockets = chatSockets.filter((cs) => cs.socket !== socket);
    });
});
