import "./Home.css";

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

import ReactPlayer from "react-player";
import { useChannel } from "./communication";

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

const VideoPlayer = (props: { src: string; roomName: string }) => {
  const videoRef = React.useRef<any>();

  const channel = useChannel(props.roomName);

  useEffect(() => {
    channel?.trigger("client-join", {
      src: props.src,
      leader: true,
    });

    // update url
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.set("room", props.roomName);
    history.pushState(null, "", "?" + queryParams.toString());
  });

  return (
    <Box maxW="100%">
      <ReactPlayer
        ref={videoRef}
        url={props.src}
        controls
        width="100%"
        height="100%"
        onBufferEnd={() => console.log("buffer end")}
        onProgress={(data) => console.log("progress", data)}
      />
    </Box>
  );
};

const Home = () => {
  const [videoSrc, setVideoSrc] = React.useState("");
  const [roomName, setRoomName] = React.useState("");

  const channel = useChannel(roomName);

  const onSetVideoSrc = (src: string) => {
    const roomName: string = uniqueNamesGenerator({
      dictionaries: [colors, adjectives, animals],
      separator: "",
      style: "capital",
    });

    setRoomName(roomName);
    setVideoSrc(src);
  };

  return (
    <Box w="100vw" h="100vh" p="32px">
      <VStack>
        <VideoSrcForm setVideoSrc={onSetVideoSrc} />
        {!!videoSrc && <VideoPlayer src={videoSrc} roomName={roomName} />}
      </VStack>
    </Box>
  );
};

export default Home;
