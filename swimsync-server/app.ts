const express = require("express");

import { Server, Socket } from "socket.io";

import { createServer } from "http";

const DEBUG = true;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

interface RoomData {
  [roomName: string]: {
    videoSrc: string,
    progress: number,
    playing: boolean
  }
}
const roomData: RoomData = {}

const broadcastToRooms = (socket: Socket, event: string, data?: any) => {
  if (DEBUG) console.log({ event, data, rooms: socket.rooms });
  socket.to(Array.from(socket.rooms)).emit(event, data);
};

io.on("connection", (socket) => {
  console.log("New connection");

  socket.on("join", (data: { room: string }) => {
    socket.join(data.room);
    broadcastToRooms(socket, "join", data.room);
    if (roomData[data.room]) {
      socket.emit('src', roomData[data.room])
    }
  });

  socket.on("leave", (data: { room: string }) => {
    socket.leave(data.room);
    broadcastToRooms(socket, "leave", data);
  });

  const passThroughEvents = ["play", "pause", "src", "seek"];

  for (let eventName of passThroughEvents) {
    socket.on(eventName, (data) => {
      for (const roomName of socket.rooms) {
        roomData[roomName] = data
      }
      broadcastToRooms(socket, eventName, data);
    });
  }

  socket.on("disconnect", () => {
    console.log("Disconnecting");
  });
});

setInterval(() => {
  for (const roomName of Object.keys(roomData)) {
    const room = io.sockets.adapter.rooms.get(roomName)
    console.log('cleanup', roomName)
    if (!room?.size) {
      console.log("cleaning up room", roomName)
      delete roomData[roomName]
    }
  }
}, 10*1000)

httpServer.listen(3010);
