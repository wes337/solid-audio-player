import type { JSX } from 'solid-js'
import { createEffect, mergeProps, onMount, children, Show, For, createSignal } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import {
  BsPlayCircleFill,
  BsPauseCircleFill,
  BsVolumeMuteFill,
  BsVolumeUpFill,
  BsRewindFill,
  BsSkipStartFill,
  BsSkipEndFill,
  BsFastForwardFill,
} from 'solid-icons/bs'
import { TbRepeat, TbRepeatOff } from 'solid-icons/tb'
import { CustomUIModules, PlayerProps } from './types'
import { SAP_UI, TIME_FORMAT } from './constants'
import { throttle, getDisplayTimeBySeconds } from './utils'
import VolumeBar from './volume-bar'
import CurrentTime from './current-time'
import ProgressBar from './progress-bar'
import Duration from './duration'
import './styles.scss'

const defaultProps = {
  autoPlay: false,
  autoPlayAfterSrcChange: true,
  listenInterval: 1000,
  progressJumpStep: 5000,
  progressJumpSteps: {}, // define when removing progressJumpStep
  volumeJumpStep: 0.1,
  loop: false,
  muted: false,
  preload: 'auto',
  progressUpdateInterval: 20,
  defaultCurrentTime: '--:--',
  defaultDuration: '--:--',
  timeFormat: 'auto',
  volume: 1,
  className: '',
  showJumpControls: true,
  showSkipControls: false,
  showDownloadProgress: true,
  showFilledProgress: true,
  showFilledVolume: false,
  customIcons: {},
  customProgressBarSection: [SAP_UI.CURRENT_TIME, SAP_UI.PROGRESS_BAR, SAP_UI.DURATION],
  customControlsSection: [SAP_UI.ADDITIONAL_CONTROLS, SAP_UI.MAIN_CONTROLS, SAP_UI.VOLUME_CONTROLS],
  customAdditionalControls: [SAP_UI.LOOP],
  customVolumeControls: [SAP_UI.VOLUME],
  layout: 'stacked',
  hasDefaultKeyBindings: true,
  i18nAriaLabels: {
    player: 'Audio player',
    progressControl: 'Audio progress control',
    volumeControl: 'Volume control',
    play: 'Play',
    pause: 'Pause',
    rewind: 'Rewind',
    forward: 'Forward',
    previous: 'Previous',
    next: 'Skip',
    loop: 'Disable loop',
    loopOff: 'Enable loop',
    volume: 'Mute',
    volumeMute: 'Unmute',
  },
}

export default function SolidAudioPlayer(props: PlayerProps) {
  const resolved = children(() => props.children)
  const merged = mergeProps(defaultProps as PlayerProps, props)
  const [playing, setPlaying] = createSignal(false)
  const [volume, setVolume] = createSignal(0)
  const [loop, setLoop] = createSignal(false)

  let audio: HTMLAudioElement | undefined
  let progressBar: HTMLDivElement | undefined
  let container: HTMLDivElement | undefined
  let lastVolume = merged.volume

  /**
   * Safely play audio
   *
   * Reference: https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
   */
  const playAudioPromise = (): void => {
    if (!audio) {
      return
    }

    if (audio.error) {
      audio.load()
    }

    const playPromise = audio.play()

    // playPromise is null in IE 11
    if (playPromise) {
      playPromise.then(null).catch(err => {
        merged.onPlayError && merged.onPlayError(new Error(err))
      })
    }
  }

  const isPlaying = (): boolean => {
    if (!audio) {
      return false
    }

    return !audio.paused && !audio.ended
  }

  const togglePlay = (event: Event): void => {
    event.stopPropagation()

    if (!audio) {
      return
    }

    if ((audio.paused || audio.ended) && audio.src) {
      playAudioPromise()
    } else if (!audio.paused) {
      audio.pause()
    }

    setPlaying(isPlaying())
  }

  const handlePlay = (e: Event): void => {
    merged.onPlay && merged.onPlay(e)
  }

  const handlePause = (e: Event): void => {
    if (!audio) {
      return
    }

    setPlaying(isPlaying())
    merged.onPause && merged.onPause(e)
  }

  const handleEnded = (e: Event): void => {
    if (!audio) {
      return
    }

    merged.onEnded && merged.onEnded(e)
  }

  const handleAbort = (e: Event): void => {
    merged.onAbort && merged.onAbort(e)
  }

  const handleClickVolumeButton = (): void => {
    if (!audio) {
      return
    }

    if (audio.volume > 0) {
      lastVolume = audio.volume
      audio.volume = 0
    } else {
      audio.volume = lastVolume !== undefined ? lastVolume : 1
    }
  }

  const handleClickLoopButton = (): void => {
    if (!audio) {
      return
    }

    const loop = !audio.loop
    audio.loop = loop
    setLoop(loop)
  }

  const handleClickRewind = (): void => {
    const jumpStep =
      (merged.progressJumpSteps !== undefined
        ? merged.progressJumpSteps.backward
        : merged.progressJumpStep) || defaultProps.progressJumpStep

    if (typeof jumpStep === 'number') {
      setJumpTime(-jumpStep)
    }
  }

  const handleClickForward = (): void => {
    const jumpStep =
      (merged.progressJumpSteps !== undefined
        ? merged.progressJumpSteps.forward
        : merged.progressJumpStep) || defaultProps.progressJumpStep

    if (typeof jumpStep === 'number') {
      setJumpTime(jumpStep)
    }
  }

  const setJumpTime = (time: number): void => {
    if (!audio) {
      return
    }

    if (
      audio.readyState === audio.HAVE_NOTHING ||
      audio.readyState === audio.HAVE_METADATA ||
      !isFinite(audio.duration) ||
      !isFinite(audio.currentTime)
    ) {
      try {
        audio.load()
      } catch (err) {
        return merged.onChangeCurrentTimeError && merged.onChangeCurrentTimeError(err as Error)
      }
    }

    let currentTime = audio.currentTime + time / 1000

    if (currentTime < 0) {
      audio.currentTime = 0
      currentTime = 0
    } else if (currentTime > audio.duration) {
      audio.currentTime = audio.duration
      currentTime = audio.duration
    } else {
      audio.currentTime = currentTime
    }
  }

  const setJumpVolume = (volume: number): void => {
    if (!audio) {
      return
    }

    let newVolume = audio.volume + volume

    if (newVolume < 0) {
      newVolume = 0
    } else if (newVolume > 1) {
      newVolume = 1
    }

    audio.volume = newVolume
  }

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (merged.hasDefaultKeyBindings) {
      switch (event.key) {
        case ' ':
          if (event.target === container || event.target === progressBar) {
            event.preventDefault() // Prevent scrolling page by pressing Space key
            togglePlay(event)
          }
          break
        case 'ArrowLeft':
          handleClickRewind()
          break
        case 'ArrowRight':
          handleClickForward()
          break
        case 'ArrowUp':
          event.preventDefault() // Prevent scrolling page by pressing arrow key
          if (typeof merged.volumeJumpStep === 'number') {
            setJumpVolume(merged.volumeJumpStep)
          }
          break
        case 'ArrowDown':
          event.preventDefault() // Prevent scrolling page by pressing arrow key
          if (typeof merged.volumeJumpStep === 'number') {
            setJumpVolume(-merged.volumeJumpStep)
          }
          break
        case 'l':
          handleClickLoopButton()
          break
        case 'm':
          handleClickVolumeButton()
          break
      }
    }
  }

  onMount(() => {
    if (!audio) {
      return
    }

    if (merged.muted) {
      audio.volume = 0
    } else {
      audio.volume = lastVolume || defaultProps.volume
    }

    audio.addEventListener('error', e => {
      const target = e.target as HTMLAudioElement
      // Calls onEnded when currentTime is the same as duration even if there is an error
      if (target.error && target.currentTime === target.duration) {
        return merged.onEnded && merged.onEnded(e)
      }
      merged.onError && merged.onError(e)
    })

    // When enough of the file has downloaded to start playing
    audio.addEventListener('canplay', e => {
      merged.onCanPlay && merged.onCanPlay(e)
    })

    // When enough of the file has downloaded to play the entire file
    audio.addEventListener('canplaythrough', e => {
      merged.onCanPlayThrough && merged.onCanPlayThrough(e)
    })

    // When audio play starts
    audio.addEventListener('play', handlePlay)

    // When unloading the audio player (switching to another src)
    audio.addEventListener('abort', handleAbort)

    // When the file has finished playing to the end
    audio.addEventListener('ended', handleEnded)

    // When the media has enough data to start playing, after the play event, but also when recovering from being
    // stalled, when looping media restarts, and after seeked, if it was playing before seeking.
    audio.addEventListener('playing', e => {
      setPlaying(isPlaying())
      merged.onPlaying && merged.onPlaying(e)
    })

    // When a seek operation begins
    audio.addEventListener('seeking', e => {
      merged.onSeeking && merged.onSeeking(e)
    })

    // when a seek operation completes
    audio.addEventListener('seeked', e => {
      merged.onSeeked && merged.onSeeked(e)
    })

    // when the requested operation (such as playback) is delayed pending the completion of another operation (such as
    // a seek).
    audio.addEventListener('waiting', e => {
      merged.onWaiting && merged.onWaiting(e)
    })

    // The media has become empty; for example, this event is sent if the media has already been loaded (or partially
    // loaded), and the load() method is called to reload it.
    audio.addEventListener('emptied', e => {
      merged.onEmptied && merged.onEmptied(e)
    })

    // when the user agent is trying to fetch media data, but data is unexpectedly not forthcoming
    audio.addEventListener('stalled', e => {
      merged.onStalled && merged.onStalled(e)
    })

    // when loading of the media is suspended; this may happen either because the download has completed or because it
    // has been paused for any other reason
    audio.addEventListener('suspend', e => {
      merged.onSuspend && merged.onSuspend(e)
    })

    //  when loading of the media begins
    audio.addEventListener('loadstart', e => {
      merged.onLoadStart && merged.onLoadStart(e)
    })

    // when media's metadata has finished loading; all attributes now contain as much useful information as they're
    // going to
    audio.addEventListener('loadedmetadata', e => {
      merged.onLoadedMetaData && merged.onLoadedMetaData(e)
    })

    // when the first frame of the media has finished loading.
    audio.addEventListener('loadeddata', e => {
      merged.onLoadedData && merged.onLoadedData(e)
    })

    // When the user pauses playback
    audio.addEventListener('pause', handlePause)

    const listenInterval =
      merged.listenInterval !== undefined ? merged.listenInterval : defaultProps.listenInterval

    audio.addEventListener(
      'timeupdate',
      throttle(e => {
        setPlaying(isPlaying())
        merged.onListen && merged.onListen(e)
      }, listenInterval),
    )

    audio.addEventListener('volumechange', e => {
      setVolume((e.target as HTMLAudioElement).volume)
      merged.onVolumeChange && merged.onVolumeChange(e)
    })

    audio.addEventListener('encrypted', e => {
      merged.mse && merged.mse.onEcrypted && merged.mse.onEcrypted(e)
    })
  })

  createEffect(() => {
    if (merged.src && merged.autoPlayAfterSrcChange) {
      playAudioPromise()
    }
  })

  const renderUIModules = (modules: CustomUIModules): JSX.Element => {
    return (
      <For each={modules}>
        {module => {
          if (!uiModules[module as SAP_UI]) {
            return module as JSX.Element
          }

          return <Dynamic component={uiModules[module as SAP_UI]} />
        }}
      </For>
    )
  }

  const defaultDuration = () => merged.defaultDuration || defaultProps.defaultDuration
  const customProgressBarSection = () =>
    merged.customProgressBarSection || defaultProps.customProgressBarSection
  const customControlsSection = () =>
    merged.customControlsSection || defaultProps.customControlsSection
  const customAdditionalControls = () =>
    merged.customAdditionalControls || defaultProps.customAdditionalControls
  const customVolumeControls = () =>
    merged.customVolumeControls || defaultProps.customVolumeControls
  const progressUpdateInterval = () =>
    merged.progressUpdateInterval || defaultProps.progressUpdateInterval
  const showDownloadProgress = () =>
    merged.showDownloadProgress || defaultProps.showDownloadProgress
  const showFilledProgress = () => merged.showFilledProgress || defaultProps.showFilledProgress
  const showFilledVolume = () => merged.showFilledVolume || defaultProps.showFilledVolume
  const timeFormat = () => merged.timeFormat || (defaultProps.timeFormat as TIME_FORMAT)

  const uiModules = {
    [SAP_UI.CURRENT_TIME]: () => (
      <div id="sap_current-time" class="sap_time sap_current-time">
        <CurrentTime
          audio={audio}
          isLeftTime={false}
          defaultCurrentTime={merged.defaultCurrentTime}
          timeFormat={timeFormat()}
        />
      </div>
    ),
    [SAP_UI.CURRENT_LEFT_TIME]: () => (
      <div id="sap_current-left-time" class="sap_time sap_current-left-time">
        <CurrentTime
          audio={audio}
          isLeftTime={true}
          defaultCurrentTime={merged.defaultCurrentTime}
          timeFormat={timeFormat()}
        />
      </div>
    ),
    [SAP_UI.PROGRESS_BAR]: () => (
      <ProgressBar
        progressBar={progressBar}
        audio={audio}
        progressUpdateInterval={progressUpdateInterval()}
        showDownloadProgress={showDownloadProgress()}
        showFilledProgress={showFilledProgress()}
        onSeek={merged.mse && merged.mse.onSeek}
        onChangeCurrentTimeError={merged.onChangeCurrentTimeError}
        srcDuration={merged.mse && merged.mse.srcDuration}
        i18nProgressBar={merged.i18nAriaLabels?.progressControl}
      />
    ),
    [SAP_UI.DURATION]: () => (
      <div class="sap_time sap_total-time">
        {merged.mse && merged.mse.srcDuration ? (
          getDisplayTimeBySeconds(merged.mse.srcDuration, merged.mse.srcDuration, timeFormat())
        ) : (
          <Duration audio={audio} defaultDuration={defaultDuration()} timeFormat={timeFormat()} />
        )}
      </div>
    ),
    [SAP_UI.ADDITIONAL_CONTROLS]: () => (
      <div class="sap_additional-controls">{renderUIModules(customAdditionalControls())}</div>
    ),
    [SAP_UI.MAIN_CONTROLS]: () => {
      return (
        <div class="sap_main-controls">
          {merged.showSkipControls && (
            <button
              aria-label={merged.i18nAriaLabels?.previous}
              class="sap_button-clear sap_main-controls-button sap_skip-button"
              type="button"
              onClick={merged.onClickPrevious}
            >
              {merged.customIcons?.previous ? merged.customIcons.previous : <BsSkipStartFill />}
            </button>
          )}
          {merged.showJumpControls && (
            <button
              aria-label={merged.i18nAriaLabels?.rewind}
              class="sap_button-clear sap_main-controls-button sap_rewind-button"
              type="button"
              onClick={handleClickRewind}
            >
              {merged.customIcons?.rewind ? merged.customIcons.rewind : <BsRewindFill />}
            </button>
          )}
          <button
            aria-label={playing() ? merged.i18nAriaLabels?.pause : merged.i18nAriaLabels?.play}
            class="sap_button-clear sap_main-controls-button sap_play-pause-button"
            type="button"
            onClick={togglePlay}
          >
            <Show
              when={playing()}
              fallback={merged.customIcons?.play ? merged.customIcons.play : <BsPlayCircleFill />}
            >
              {merged.customIcons?.pause ? merged.customIcons.pause : <BsPauseCircleFill />}
            </Show>
          </button>
          {merged.showJumpControls && (
            <button
              aria-label={merged.i18nAriaLabels?.forward}
              class="sap_button-clear sap_main-controls-button sap_forward-button"
              type="button"
              onClick={handleClickForward}
            >
              {merged.customIcons?.forward ? merged.customIcons.forward : <BsFastForwardFill />}
            </button>
          )}
          {merged.showSkipControls && (
            <button
              aria-label={merged.i18nAriaLabels?.next}
              class="sap_button-clear sap_main-controls-button sap_skip-button"
              type="button"
              onClick={merged.onClickNext}
            >
              {merged.customIcons?.next ? merged.customIcons.next : <BsSkipEndFill />}
            </button>
          )}
        </div>
      )
    },
    [SAP_UI.VOLUME_CONTROLS]: () => (
      <div class="sap_volume-controls">{renderUIModules(customVolumeControls())}</div>
    ),
    [SAP_UI.LOOP]: () => {
      return (
        <button
          aria-label={loop() ? merged.i18nAriaLabels?.loop : merged.i18nAriaLabels?.loopOff}
          class="sap_button-clear sap_repeat-button"
          type="button"
          onClick={handleClickLoopButton}
        >
          <Show
            when={loop()}
            fallback={merged.customIcons?.loopOff ? merged.customIcons.loopOff : <TbRepeatOff />}
          >
            {merged.customIcons?.loop ? merged.customIcons.loop : <TbRepeat />}
          </Show>
        </button>
      )
    },
    [SAP_UI.VOLUME]: () => {
      return (
        <div class="sap_volume-container">
          <button
            aria-label={
              volume() ? merged.i18nAriaLabels?.volume : merged.i18nAriaLabels?.volumeMute
            }
            onClick={handleClickVolumeButton}
            type="button"
            class="sap_button-clear sap_volume-button"
          >
            <Show
              when={volume()}
              fallback={
                merged.customIcons?.volume ? merged.customIcons.volumeMute : <BsVolumeMuteFill />
              }
            >
              {merged.customIcons?.volume ? merged.customIcons.volume : <BsVolumeUpFill />}
            </Show>
          </button>
          <VolumeBar
            audio={audio}
            volume={volume()}
            // onMuteChange={handleMuteChange}
            showFilledVolume={showFilledVolume()}
            i18nVolumeControl={merged.i18nAriaLabels?.volumeControl}
          />
        </div>
      )
    },
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={merged.i18nAriaLabels?.player}
      classList={{
        ['sap_container']: true,
        ['sap_loop--on']: loop(),
        ['sap_loop--off']: !loop(),
        ['sap_play-status--playing']: playing(),
        ['sap_play-status--paused']: !playing(),
        [merged.className || '']: !!merged.className,
      }}
      onKeyDown={handleKeyDown}
      ref={container}
      style={merged.style}
    >
      <audio
        src={merged.src}
        controls={false}
        loop={loop()}
        autoplay={merged.autoPlay}
        preload={merged.preload}
        crossOrigin={merged.crossOrigin}
        mediaGroup={merged.mediaGroup}
        ref={audio}
      >
        {resolved()}
      </audio>
      <Show when={merged.header}>
        <div class="sap_header">{merged.header}</div>
      </Show>
      <div
        classList={{
          ['sap_main']: true,
          ['sap_stacked']: !merged.layout || merged.layout === 'stacked',
          ['sap_stacked-reverse']: merged.layout === 'stacked-reverse',
          ['sap_horizontal']: merged.layout === 'horizontal',
          ['sap_horizontal-reverse']: merged.layout === 'horizontal-reverse',
        }}
      >
        <div class="sap_progress-section">{renderUIModules(customProgressBarSection())}</div>
        <div class="sap_controls-section">{renderUIModules(customControlsSection())}</div>
      </div>
      <Show when={merged.footer}>
        <div class="sap_footer">{merged.footer}</div>
      </Show>
    </div>
  )
}
