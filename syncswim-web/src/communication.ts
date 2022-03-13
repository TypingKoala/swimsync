import * as React from "react";

import { Socket, io } from "socket.io-client";

let socket: Socket | undefined;
let callbacksRegistered = false;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://swimserver.johnnybui.com:3010");
  }

  return socket;
};

export interface PlayerState {
  playing: boolean;
  progress: number; // in seconds
  videoSrc: string;
}

export interface SetPlayerState {
  setPlaying: (playState: boolean) => void;
  setProgress: (seconds: number) => void;
  setVideoSrc: (src: string) => void;
}

export type GetSetPlayerState = PlayerState & SetPlayerState;

export type SendEvent = (eventType: EventType, progress: number, videoSrc: string) => void;

const registerCallbacks = (args: SetPlayerState) => {
  if (callbacksRegistered) {
    return;
  }
  callbacksRegistered = true;

  const socket = getSocket();

  const syncState = (eventType: EventType, data: PlayerState) => {
    switch (eventType) {
      case EventType.PLAY:
        args.setPlaying(true)
        args.setProgress(data.progress)
        break
      case EventType.PAUSE:
        args.setPlaying(false)
        args.setProgress(data.progress) 
        break
      case EventType.CHANGE_SRC:
        args.setVideoSrc(data.videoSrc)
        args.setPlaying(false)
        args.setProgress(0)
        break
      case EventType.SEEK:
        args.setPlaying(data.playing)
        args.setProgress(data.progress)
        break
    }
  };

  socket.on("play", data => syncState(EventType.PLAY, data));

  socket.on("pause", data => syncState(EventType.PAUSE, data));

  socket.on("src", data => syncState(EventType.CHANGE_SRC, data));

  socket.on("seek", data => syncState(EventType.SEEK, data))
};

export const enum EventType {
  PLAY,
  PAUSE,
  SEEK,
  CHANGE_SRC,
}

export type PlayerStateWithEventDispatch = GetSetPlayerState & {
  sendEvent: SendEvent;
};

export const usePlayerState = (
  roomName: string
): PlayerStateWithEventDispatch => {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [videoSrc, setVideoSrc] = React.useState("");

  const playerState: PlayerState = {
    playing,
    progress,
    videoSrc,
  };

  const setPlayerState: SetPlayerState = {
    setPlaying,
    setProgress,
    setVideoSrc,
  };

  const sendEvent = (
    eventType: EventType,
    progress: number,
    videoSrc: string
  ) => {
    switch (eventType) {
      case EventType.PLAY:
        setPlaying(true);
        socket.emit("play", { playing: true, progress, videoSrc });
        break;
      case EventType.PAUSE:
        setPlaying(false);
        socket.emit("pause", { playing: false, progress, videoSrc });
        break;
      case EventType.SEEK:
        socket.emit("seek", { playing, progress, videoSrc });
        break;
      case EventType.CHANGE_SRC:
        socket.emit("src", { videoSrc });
        break;
    }
  };

  // join the room
  const socket = getSocket();

  React.useEffect(() => {
    registerCallbacks(setPlayerState);
    socket.emit("join", { room: roomName });

    return () => {
      socket.emit("leave", { room: roomName });
    };
  }, [roomName]);

  return { ...playerState, ...setPlayerState, sendEvent };
};
