import WebSocket, { WebSocketServer } from "ws";
import "dotenv/config";

const wss = new WebSocketServer({ port: Number(process.env.PORT) || 8080 });

interface ChatSocket {
    [roomId: string]: WebSocket[];
}

let chatSockets: ChatSocket = {};
// {
//     roomId: [socket1, socket2],
//     roomId: [socket3, socket4],
// }

wss.on("connection", function connection(socket) {
    console.log("user connected");

    socket.on("message", (data) => {
        const { type, payload } = JSON.parse(data.toString());

        if (type === "create") {
            const { roomId } = payload;

            // check if the roomID exists
            if (roomId in chatSockets) {
                socket.send(
                    JSON.stringify({
                        type: "error",
                        payload: { message: "Room ID already exists" },
                    })
                );
                return;
            }

            chatSockets[roomId] = [];
        }

        if (type === "join") {
            const { roomId } = payload;

            // delete all previous connection
            Object.keys(chatSockets).forEach((roomId) => {
                chatSockets[roomId] = chatSockets[roomId].filter(
                    (cs) => cs !== socket
                );
            });

            // connect new chat socket
            if (chatSockets[roomId]) {
                chatSockets[roomId].push(socket);
            } else {
                chatSockets[roomId] = [socket];
            }

            // send user count
            chatSockets[roomId]?.map((sc) =>
                sc.send(
                    JSON.stringify({
                        type: "count",
                        payload: {
                            count: chatSockets[roomId].length,
                        },
                    })
                )
            );
        }

        if (type === "message") {
            const { message, name, roomId } = payload;

            // send Message to all other connected chat sockets except myself
            chatSockets[roomId]?.forEach((cs) =>
                cs === socket
                    ? null
                    : cs.send(
                          JSON.stringify({
                              type: "message",
                              payload: { message, name },
                          })
                      )
            );
        }
    });

    socket.on("close", () => {
        // remove chat socket
        let userRoomId;
        Object.keys(chatSockets).forEach((roomId) => {
            chatSockets[roomId] = chatSockets[roomId].filter(
                (cs) => cs !== socket
            );
            userRoomId = roomId;
        });

        // room id deleted if no user
        if (chatSockets[userRoomId!].length === 0) {
            delete chatSockets[userRoomId!];
            return;
        }

        // send user count
        chatSockets[userRoomId!]?.map((sc) =>
            sc.send(
                JSON.stringify({
                    type: "count",
                    payload: {
                        count: chatSockets[userRoomId!].length,
                    },
                })
            )
        );

        console.log("user disconnected");
    });
});
