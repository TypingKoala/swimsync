import "./Home.css";

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";
import { SubmitHandler, useForm } from "react-hook-form";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import ReactPlayer from "react-player";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

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
          <InputGroup size="md">
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
            <InputRightElement m="4px">
              <IconButton
                type="submit"
                size="sm"
                aria-label="Submit"
                icon={<FontAwesomeIcon icon={faArrowRight} />}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.videoSrc?.message}</FormErrorMessage>
        </FormControl>
      </Flex>
    </form>
  );
};

const VideoPlayer = (props: { src: string }) => {
  const videoRef = React.useRef<any>()

  if (!props.src) {
    return <></>;
  }

  return (
    <Box maxW="100%">
      <ReactPlayer
        ref={videoRef}
        url={props.src}
        controls
        width="100%"
        height="100%"
        onBufferEnd={() => console.log("buffer end")}
        onProgress={data => console.log("progress", data) }
      />
    </Box>
  );
};

const Home = () => {
  const [videoSrc, setVideoSrc] = React.useState("");

  return (
    <Box w="100vw" h="100vh" p="32px">
      <VStack>
        <VideoSrcForm setVideoSrc={(src) => setVideoSrc(src)} />
        <VideoPlayer src={videoSrc} />
      </VStack>
    </Box>
  );
};

export default Home;
