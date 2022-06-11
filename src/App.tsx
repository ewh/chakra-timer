// import React from 'react';
// import logo from './logo.svg';
// import './App.css';

import { useEffect, useState } from 'react';
import { Field, Form, Formik } from 'formik';

import {
  Box,
  Button,
  Container,
  ChakraProvider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Icon,
  VStack,
} from '@chakra-ui/react';

import { MdPauseCircle, MdPlayCircle } from 'react-icons/md';
import { DateTime, Duration, Interval } from 'luxon';

interface Countdown {
  duration: Duration;
  start?: DateTime;
}

const getRemainingDuration = (
  countdown: Countdown
): [Duration, Duration] | undefined => {
  if (countdown.start) {
    const now = DateTime.now();

    const runningDuration = Interval.fromDateTimes(
      countdown.start,
      now
    ).toDuration();
    console.log(
      'duration',
      countdown.start.toString(),
      now.toString(),
      runningDuration.toString()
    );
    let actualRemaining = countdown.duration.minus(runningDuration);
    let remainingDuration = actualRemaining;
    if (remainingDuration.milliseconds !== 0) {
      const remainingDurationMs =
        Math.ceil(remainingDuration.toMillis() / 1000) * 1000;
      remainingDuration = Duration.fromMillis(remainingDurationMs);
    }
    if (actualRemaining.toMillis() < 0) {
      console.log('zero correct', actualRemaining.toMillis());
      actualRemaining = Duration.fromMillis(0);
      remainingDuration = Duration.fromMillis(0);
    }
    console.log(
      'remaining',
      actualRemaining.toMillis(),
      remainingDuration.toMillis()
    );
    return [actualRemaining, remainingDuration];
  }
};

const defaultDuration = Duration.fromObject({ minutes: 25, seconds: 0 });
const refreshInterval = 500;

function App() {
  const [remaining, setRemaining] = useState(defaultDuration);
  const [actualRemaining, setActualRemaining] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [timerId, setTimerId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<Countdown>({
    duration: defaultDuration,
  });
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    if (isRunning && !timerId) {
      const timerId = window.setInterval(() => {
        const durations = getRemainingDuration({
          ...countdown,
          start,
        });
        // console.log(
        //   'in interval',
        //   countdown.duration.toMillis(),
        //   countdown.start?.toString(),
        //   start.toString()
        //   // durations?.[0]
        // );
        if (durations) {
          const [actualRemaining, remainingDuration] = durations;
          if (durations !== undefined) {
            // console.log('check', timerId, remainingDuration?.toMillis());
            setRemaining(remainingDuration);
            setActualRemaining(actualRemaining.normalize());
            if (actualRemaining.toMillis() <= 0) {
              console.log('KILL', timerId, actualRemaining.toMillis());
              setIsRunning(false);
              clearInterval(timerId);
              setTimerId(null);
              notify();
            }
          }
        }
      }, refreshInterval);
      setTimerId(timerId);

      const now = DateTime.now();
      console.log('start', countdown.duration.toMillis());
      const newCountdown = { ...countdown, start: now };
      console.log('start', newCountdown);
      // countdown.start = now;
      const start = now;
      setCountdown(newCountdown);
    } else if (!isRunning && timerId) {
      console.log('stop system', countdown.duration.toMillis());
      clearInterval(timerId);
      setTimerId(null);
      const durations = getRemainingDuration(countdown);
      if (durations) {
        let [actualRemainging, remainingDuration] = durations;
        setRemaining(remainingDuration);
        setActualRemaining(actualRemaining);
        setCountdown({ duration: actualRemainging });
      }
    }
  }, [countdown, isRunning, timerId, actualRemaining, remaining]);

  // useEffect(() => {
  //   console.log('REMAINING', remaining.toFormat('m:ss'));
  // }, [remaining]);
  // useEffect(() => {
  //   console.log('RUNNING', isRunning);
  //   // return () => console.log('END RUNNING', isRunning);
  // }, [isRunning]);

  const isDone = remaining.toMillis() === 0;
  const bgColor = isDone ? 'red.400' : 'gray.50';

  return (
    <ChakraProvider>
      <Container maxW="container.md">
        <Box m={2} bg={bgColor}>
          <VStack>
            <HStack spacing={5}>
              <Button
                m={2}
                minW="20"
                isDisabled={isDone}
                onClick={() => {
                  setIsRunning(!isRunning);
                }}
              >
                {isRunning ? (
                  <Icon as={MdPauseCircle} />
                ) : (
                  <Icon as={MdPlayCircle} />
                )}
              </Button>
              <Button
                m={2}
                minW="20"
                isDisabled={isRunning}
                onClick={() => {
                  if (!isRunning) {
                    setRemaining(defaultDuration);
                    setActualRemaining(defaultDuration);
                    setCountdown({ duration: defaultDuration });
                    setTimerId(null);
                  }
                }}
              >
                Reset
              </Button>
              <Heading m={2}>{remaining.toFormat('m:ss')}</Heading>
              <Heading m={2}>{actualRemaining.toFormat('m:ss.SSS')}</Heading>
              <Button
                m={2}
                minW="20"
                isDisabled={isRunning}
                onClick={() => setFormVisible(!formVisible)}
              >
                Set
              </Button>
              {/* <Button onClick={notify}>Notify</Button> */}
            </HStack>
            {formVisible ? (
              <HStack>
                <Formik
                  initialValues={{ minutes: '25', seconds: '00' }}
                  onSubmit={(values, actions) => {
                    const { minutes, seconds } = values;
                    const duration = Duration.fromObject({
                      minutes: parseInt(minutes),
                      seconds: parseInt(seconds),
                    });
                    setCountdown({ duration });
                    setActualRemaining(duration);
                    setRemaining(duration);
                    actions.setSubmitting(false);
                  }}
                >
                  {(props) => (
                    <Form>
                      <Field name="minutes" validate={validateTime}>
                        {({ field, form }: { field: any; form: any }) => (
                          <FormControl isInvalid={form.errors.minutes}>
                            <FormLabel htmlFor="minutes">Minutes</FormLabel>
                            <Input {...field} id="minutes" />
                            <FormErrorMessage>
                              {form.errors.minutes}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      <Field name="seconds" validate={validateTime}>
                        {({ field, form }: { field: any; form: any }) => (
                          <FormControl isInvalid={form.errors.seconds}>
                            <FormLabel htmlFor="seconds">Seconds</FormLabel>
                            <Input {...field} id="seconds" />
                            <FormErrorMessage>
                              {form.errors.seconds}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      <Button
                        mt={4}
                        colorScheme="teal"
                        isLoading={props.isSubmitting}
                        type="submit"
                      >
                        Submit
                      </Button>
                    </Form>
                  )}
                </Formik>
              </HStack>
            ) : null}
          </VStack>
        </Box>
      </Container>
    </ChakraProvider>
  );
}

async function notify() {
  console.log(Notification.permission);
  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    console.log('perm', perm);
  }
  if (Notification.permission === 'granted') {
    new Notification('Countdown Done', {
      // body: 'Done',
      requireInteraction: true,
    });
  }
}

export default App;

function validateTime(value: string): string | undefined {
  const num = parseInt(value);
  if (isNaN(num)) {
    return 'Illegal';
  }
  if (num < 0 || num > 59) {
    return 'Out of bounds';
  }
  return undefined;
}
