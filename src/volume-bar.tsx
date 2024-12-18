import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { VolumeBarProps, VolumePosInfo } from "./types";
import { getPosX } from "./utils";

export default function VolumeBar(props: VolumeBarProps) {
  const volume = () => (props.volume == undefined ? 1 : props.volume);

  const [hasVolumeAnimation, setHasVolumeAnimation] = createSignal(false);
  const [isDraggingVolume, setIsDraggingVolume] = createSignal(false);
  const [currentVolumePos, setCurrentVolumePos] = createSignal(
    `${((volume() / 1) * 100 || 0).toFixed(2)}%`
  );

  let audio: HTMLAudioElement | undefined;
  let hasAddedAudioEventListener = false;
  let volumeBar: HTMLDivElement | undefined;
  let volumeAnimationTimer = 0;
  let lastVolume = volume(); // To store the volume before clicking mute button

  const getCurrentVolume = (event: TouchEvent | MouseEvent): VolumePosInfo => {
    if (!props.audio) {
      return {
        currentVolume: 0,
        currentVolumePos: currentVolumePos(),
      };
    }

    if (!volumeBar) {
      return {
        currentVolume: props.audio.volume,
        currentVolumePos: currentVolumePos(),
      };
    }

    const volumeBarRect = volumeBar.getBoundingClientRect();
    const maxRelativePos = volumeBarRect.width;
    const relativePos = getPosX(event) - volumeBarRect.left;

    let currentVolume;
    let newCurrentVolumePos;

    if (relativePos < 0) {
      currentVolume = 0;
      newCurrentVolumePos = "0%";
    } else if (relativePos > volumeBarRect.width) {
      currentVolume = 1;
      newCurrentVolumePos = "100%";
    } else {
      currentVolume = relativePos / maxRelativePos;
      newCurrentVolumePos = `${(relativePos / maxRelativePos) * 100}%`;
    }

    return { currentVolume, currentVolumePos: newCurrentVolumePos };
  };

  const handleContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  const handleClickVolumeButton = (): void => {
    if (!props.audio) {
      return;
    }

    if (props.audio.volume > 0) {
      lastVolume = props.audio.volume;
      props.audio.volume = 0;
    } else {
      props.audio.volume = lastVolume;
    }
  };

  const handleVolumeControlMouseOrTouchDown = (
    event: MouseEvent | TouchEvent
  ): void => {
    event.stopPropagation();

    if (!props.audio) {
      return;
    }

    const { currentVolume, currentVolumePos } = getCurrentVolume(event);
    props.audio.volume = currentVolume;

    setIsDraggingVolume(true);
    setCurrentVolumePos(currentVolumePos);

    if (event instanceof MouseEvent) {
      window.addEventListener("mousemove", handleWindowMouseOrTouchMove);
      window.addEventListener("mouseup", handleWindowMouseOrTouchUp);
    } else {
      window.addEventListener("touchmove", handleWindowMouseOrTouchMove);
      window.addEventListener("touchend", handleWindowMouseOrTouchUp);
    }
  };

  const handleWindowMouseOrTouchMove = (
    event: TouchEvent | MouseEvent
  ): void => {
    if (event instanceof MouseEvent) {
      event.preventDefault();
    }

    event.stopPropagation();

    if (!props.audio) {
      return;
    }

    // Prevent Chrome drag selection bug
    const windowSelection: Selection | null = window.getSelection();
    if (windowSelection && windowSelection.type === "Range") {
      windowSelection.empty();
    }

    if (isDraggingVolume()) {
      const { currentVolume, currentVolumePos } = getCurrentVolume(event);
      props.audio.volume = currentVolume;
      setCurrentVolumePos(currentVolumePos);
    }
  };

  const handleWindowMouseOrTouchUp = (event: MouseEvent | TouchEvent): void => {
    event.stopPropagation();

    setIsDraggingVolume(false);

    if (event instanceof MouseEvent) {
      window.removeEventListener("mousemove", handleWindowMouseOrTouchMove);
      window.removeEventListener("mouseup", handleWindowMouseOrTouchUp);
    } else {
      window.removeEventListener("touchmove", handleWindowMouseOrTouchMove);
      window.removeEventListener("touchend", handleWindowMouseOrTouchUp);
    }
  };

  const handleAudioVolumeChange = (event: Event): void => {
    const { volume } = event.target as HTMLAudioElement;
    if ((lastVolume > 0 && volume === 0) || (lastVolume === 0 && volume > 0)) {
      props.onMuteChange?.();
    }

    lastVolume = volume;

    if (isDraggingVolume()) {
      return;
    }

    setHasVolumeAnimation(true);
    setCurrentVolumePos(`${((volume / 1) * 100 || 0).toFixed(2)}%`);

    clearTimeout(volumeAnimationTimer);
    volumeAnimationTimer = setTimeout(() => {
      setHasVolumeAnimation(false);
    }, 100);
  };

  createEffect(() => {
    if (props.audio && !hasAddedAudioEventListener) {
      audio = props.audio;
      hasAddedAudioEventListener = true;
      audio.addEventListener("volumechange", handleAudioVolumeChange);
    }
  });

  onCleanup(() => {
    if (audio && hasAddedAudioEventListener) {
      audio.removeEventListener("volumechange", handleAudioVolumeChange);
    }

    clearTimeout(volumeAnimationTimer);
  });

  return (
    <div
      ref={volumeBar}
      onMouseDown={handleVolumeControlMouseOrTouchDown}
      onTouchStart={handleVolumeControlMouseOrTouchDown}
      onContextMenu={handleContextMenu}
      role="progressbar"
      aria-label={props.i18nVolumeControl}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Number((volume() * 100).toFixed(0))}
      tabIndex={0}
      class="sap_volume-bar-area"
    >
      <div class="sap_volume-bar">
        <div
          class="sap_volume-indicator"
          style={{
            left: currentVolumePos(),
            "transition-duration": hasVolumeAnimation() ? ".1s" : "0s",
          }}
        />
        <Show when={props.showFilledVolume}>
          <div
            class="sap_volume-filled"
            style={{ width: currentVolumePos() }}
          />
        </Show>
      </div>
    </div>
  );
}
