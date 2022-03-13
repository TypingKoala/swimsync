import "./Home.css";

import {
  AspectRatio,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import { EventType, GetSetPlayerState, PlayerStateWithEventDispatch, usePlayerState } from "./communication";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

import ReactPlayer from "react-player";

interface VideoSrcFormProps {
  setVideoSrc: (src: string) => void;
}

interface FormInputs {
  videoSrc: string;
}

const VideoSrcForm = (props: VideoSrcFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    props.setVideoSrc(data.videoSrc);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="VideoSrcForm">
      <Flex justifyContent="center">
        <FormControl isInvalid={!!errors.videoSrc} maxWidth="800px">
          <HStack>
            <Input
              placeholder="Enter video url..."
              size="lg"
              pr="3em"
              autoFocus
              defaultValue="https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4"
              {...register("videoSrc", {
                required: "Please enter a valid video URL",
                validate: (url) =>
                  ReactPlayer.canPlay(url) ||
                  "This video type cannot be played",
              })}
            />
            <Button type="submit" aria-label="Go">
              Go
            </Button>
          </HStack>
          <FormErrorMessage>{errors.videoSrc?.message}</FormErrorMessage>
        </FormControl>
      </Flex>
    </form>
  );
};

interface VideoPlayerProps {
  roomName: string;
  playerState: PlayerStateWithEventDispatch;
}

const PROGRESS_DRIFT_THRESHOLD = 2; // in seconds

const VideoPlayer = (props: VideoPlayerProps) => {
  let videoRef: ReactPlayer | null;

  const { setPlaying, setProgress, sendEvent, playing, videoSrc, progress } =
    props.playerState;

  const syncProgress = () => {
    if (videoRef === null) {
      return;
    }
    const currentTime = videoRef.getCurrentTime();
    const progressDrift = Math.abs(progress - currentTime);
    if (progressDrift > PROGRESS_DRIFT_THRESHOLD) {
      console.log("seek", progress, currentTime);
      videoRef?.seekTo(progress, "seconds");
    }
  };

  useEffect(() => {
    syncProgress();
  }, [progress]);

  const onPlay = () => {
    if (videoRef === null) {
      return;
    }
    const seconds = videoRef.getCurrentTime();
    setProgress(seconds);

    sendEvent(EventType.PLAY, seconds, videoSrc);
  };

  const onPause = () => {
    if (videoRef === null) {
      return;
    }
    const seconds = videoRef.getCurrentTime();
    setProgress(seconds);
    sendEvent(EventType.PAUSE, seconds, videoSrc);
  };

  const onSeek = (seconds: number) => {
    console.log("seek", seconds)
    setProgress(seconds);
    sendEvent(EventType.SEEK, seconds, videoSrc);
  };

  const onProgress = (seconds: number) => {
    setProgress(seconds);
  };

  const onBuffer = () => {
    console.log("buffering");
  };

  const onBufferEnd = () => {
    console.log("buffer end")
  };

  return (
    <Box width="100vw" p="32px" maxW="800px">
      <AspectRatio width="100%" ratio={16 / 9}>
        <ReactPlayer
          ref={(ref) => {
            videoRef = ref;
            syncProgress();
          }}
          playing={playing}
          url={videoSrc}
          controls
          width="100%"
          height="100%"
          onSeek={(seconds) => onSeek(seconds)}
          onProgress={(data) => onProgress(data.playedSeconds)}
          onBuffer={onBuffer}
          onBufferEnd={onBufferEnd}
          onPlay={onPlay}
          onPause={onPause}
        />
      </AspectRatio>
    </Box>
  );
};

const Home = () => {
  const [roomName, setRoomName] = React.useState("");

  const playerState = usePlayerState(roomName);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const roomName = urlParams.get("room");
    if (roomName) {
      console.log("Joining", roomName);
      setRoomName(roomName);
    }
  }, []);

  const onSetVideoSrc = (newVideoSrc: string) => {
    // if videoSrc hasn't changed, then no-op
    if (playerState.videoSrc === newVideoSrc) {
      return;
    }

    // if videoSrc has changed but we are already in a room,
    // just update the videoSrc
    playerState.setVideoSrc(newVideoSrc);
    playerState.sendEvent(EventType.CHANGE_SRC, 0, newVideoSrc);

    // don't change roomName if already set
    if (!!roomName) {
      return;
    }

    // otherwise, create a new roomName and update the address bar
    const newRoomName: string = uniqueNamesGenerator({
      dictionaries: [colors, adjectives, animals],
      separator: "",
      style: "capital",
    });

    setRoomName(newRoomName);

    const url = new URL(window.location.href);
    url.searchParams.set("room", newRoomName);
    history.replaceState("", "", url.toString());
  };

  return (
    <Box w="100vw" h="100vh" p="32px">
      <VStack>
        <VideoSrcForm setVideoSrc={onSetVideoSrc} />
        {!!roomName && (
          <VideoPlayer roomName={roomName} playerState={playerState} />
        )}
      </VStack>
    </Box>
  );
};

export default Home;
