// import React from 'react';
// import logo from './logo.svg';
// import './App.css';

import { useEffect, useState } from 'react';
import { Field, FieldProps, Form, Formik } from 'formik';
import * as Yup from 'yup';

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
  Tooltip,
  VStack,
} from '@chakra-ui/react';

import {
  MdPauseCircle,
  MdPlayCircle,
  MdRotateLeft,
  MdSettings,
} from 'react-icons/md';
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
    let actualRemaining = countdown.duration.minus(runningDuration);
    let remainingDuration = actualRemaining;
    if (remainingDuration.milliseconds !== 0) {
      const remainingDurationMs =
        Math.ceil(remainingDuration.toMillis() / 1000) * 1000;
      remainingDuration = Duration.fromMillis(remainingDurationMs);
    }
    if (actualRemaining.toMillis() < 0) {
      actualRemaining = Duration.fromMillis(0);
      remainingDuration = Duration.fromMillis(0);
    }
    return [actualRemaining, remainingDuration];
  }
};

const initialDuration = Duration.fromObject({ minutes: 25, seconds: 0 });
const refreshInterval = 500;

function MyIcon({ label, icon }: { label: string; icon: any }): any {
  return (
    <Tooltip label={label}>
      <span>
        <Icon as={icon} />
      </span>
    </Tooltip>
  );
}

function App() {
  const [defaultDuration, setDefaultDuration] = useState(initialDuration);
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
        if (durations) {
          const [actualRemaining, remainingDuration] = durations;
          if (durations !== undefined) {
            setRemaining(remainingDuration);
            setActualRemaining(actualRemaining.normalize());
            if (actualRemaining.toMillis() <= 0) {
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
      const newCountdown = { ...countdown, start: now };
      // countdown.start = now;
      const start = now;
      setCountdown(newCountdown);
    } else if (!isRunning && timerId) {
      clearInterval(timerId);
      setTimerId(null);
      const durations = getRemainingDuration(countdown);
      if (durations) {
        let [actualRemaining, remainingDuration] = durations;
        setRemaining(remainingDuration);
        setActualRemaining(actualRemaining);
        setCountdown({ duration: actualRemaining });
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
                  <MyIcon label="Pause" icon={MdPauseCircle} />
                ) : (
                  <MyIcon label="Play" icon={MdPlayCircle} />
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
                <MyIcon label="Reset" icon={MdRotateLeft} />
              </Button>
              <Heading m={2}>{remaining.toFormat('m:ss')}</Heading>
              {/* <Heading m={2}>{actualRemaining.toFormat('m:ss.SSS')}</Heading> */}
              <Button
                m={2}
                minW="20"
                isDisabled={isRunning}
                onClick={() => setFormVisible(!formVisible)}
              >
                <MyIcon label="Settings" icon={MdSettings} />
              </Button>
              {/* <Button onClick={notify}>Notify</Button> */}
            </HStack>
            {formVisible ? (
              <HStack>
                <Formik
                  initialValues={{
                    minutes: defaultDuration.minutes.toString(),
                    seconds: defaultDuration.seconds.toString(),
                  }}
                  validationSchema={Yup.object({
                    minutes: Yup.number()
                      .integer()
                      .required()
                      .min(0)
                      .max(59)
                      // eslint-disable-next-line no-template-curly-in-string
                      .typeError('Invalid ${type}: ${value}'),
                    seconds: Yup.number()
                      .integer()
                      .required()
                      .min(0)
                      .max(59)
                      // eslint-disable-next-line no-template-curly-in-string
                      .typeError('Invalid ${type}: ${value}'),
                  })}
                  onSubmit={(values, actions) => {
                    const { minutes, seconds } = values;
                    const duration = Duration.fromObject({
                      minutes: parseInt(minutes),
                      seconds: parseInt(seconds),
                    });
                    setDefaultDuration(duration);
                    setCountdown({ duration });
                    setActualRemaining(duration);
                    setRemaining(duration);
                    actions.setSubmitting(false);
                  }}
                >
                  {(props) => (
                    <Form>
                      <Field name="minutes">
                        {({ field, form }: FieldProps) => (
                          <FormControl isInvalid={Boolean(form.errors.minutes)}>
                            <FormLabel htmlFor="minutes">Minutes</FormLabel>
                            <Input {...field} id="minutes" />
                            <FormErrorMessage>
                              {form.touched.minutes &&
                                form.errors.minutes?.toString()}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      <Field name="seconds">
                        {({ field, form }: FieldProps) => (
                          <FormControl isInvalid={Boolean(form.errors.seconds)}>
                            <FormLabel htmlFor="seconds">Seconds</FormLabel>
                            <Input {...field} id="seconds" />
                            <FormErrorMessage>
                              {form.touched.seconds &&
                                form.errors.seconds?.toString()}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>
                      <HStack>
                        <Button
                          my={2}
                          colorScheme="teal"
                          isLoading={props.isSubmitting}
                          type="submit"
                        >
                          Set Timer
                        </Button>
                        <Button
                          my={2}
                          colorScheme="teal"
                          isLoading={props.isSubmitting}
                          type="reset"
                        >
                          Reset
                        </Button>
                      </HStack>
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
    new Notification(`Countdown Done: ${new Date().toLocaleTimeString()}`, {
      // body: 'Done',
      requireInteraction: true,
    });
  }
}

export default App;

// function validateTime(value: string): string | undefined {
//   const num = parseInt(value);
//   if (isNaN(num)) {
//     return 'Illegal';
//   }
//   if (num < 0 || num > 59) {
//     return 'Out of bounds';
//   }
//   return undefined;
// }
