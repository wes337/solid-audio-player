import type { JSX } from "solid-js";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { DurationProps } from "./types";
import { getDisplayTimeBySeconds } from "./utils";

export default function Duration(props: DurationProps) {
  const [duration, setDuration] = createSignal<JSX.Element>(
    props.audio
      ? getDisplayTimeBySeconds(
          props.audio.duration,
          props.audio.duration,
          props.timeFormat
        )
      : props.defaultDuration
  );

  let audio: HTMLAudioElement | undefined;
  let hasAddedAudioEventListener = false;

  const handleAudioDurationChange = (event: Event): void => {
    const audio = event.target as HTMLAudioElement;

    const duration =
      getDisplayTimeBySeconds(
        audio.duration,
        audio.duration,
        props.timeFormat
      ) || props.defaultDuration;

    setDuration(duration);
  };

  const addAudioEventListeners = (): void => {
    if (props.audio && !hasAddedAudioEventListener) {
      audio = props.audio;
      hasAddedAudioEventListener = true;
      audio.addEventListener("durationchange", handleAudioDurationChange);
      audio.addEventListener("abort", handleAudioDurationChange);
    }
  };

  onMount(() => {
    addAudioEventListeners();
  });

  createEffect(() => {
    addAudioEventListeners();
  });

  onCleanup(() => {
    if (audio && hasAddedAudioEventListener) {
      audio.removeEventListener("durationchange", handleAudioDurationChange);
      audio.removeEventListener("abort", handleAudioDurationChange);
    }
  });

  return <>{duration()}</>;
}
