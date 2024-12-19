import type { Store } from 'solid-js/store'
import { createEffect, For, onCleanup, onMount, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { DownloadProgress, ProgressBarProps, ProgressBarState, TimePosInfo } from './types'
import { getPosX, throttle } from './utils'

export default function ProgressBar(props: ProgressBarProps) {
  let audio: HTMLAudioElement | undefined
  let timeOnMouseMove = 0 // Audio's current time while mouse is down and moving over the progress bar
  let hasAddedAudioEventListener = false
  let downloadProgressAnimationTimer: number | undefined

  const [state, setState] = createStore<Store<ProgressBarState>>({
    isDraggingProgress: false,
    currentTimePos: '0%',
    hasDownloadProgressAnimation: false,
    downloadProgressArr: [],
    waitingForSeekCallback: false,
  })

  const getDuration = (): number => {
    const duration =
      typeof props.srcDuration == 'undefined' ? props.audio?.duration : props.srcDuration

    return duration || 0
  }

  const getCurrentProgress = (event: MouseEvent | TouchEvent): TimePosInfo => {
    if (!props.audio) {
      return {
        currentTime: 0,
        currentTimePos: '0%',
      }
    }

    const isSingleFileProgressiveDownload =
      props.audio.src.indexOf('blob:') !== 0 && typeof props.srcDuration === 'undefined'

    if (
      isSingleFileProgressiveDownload &&
      (!props.audio.src || !isFinite(props.audio.currentTime) || !props.progressBar)
    ) {
      return { currentTime: 0, currentTimePos: '0%' }
    }

    const progressBarRect = props.progressBar?.getBoundingClientRect()
    const maxRelativePos = progressBarRect?.width || 0

    let relativePos = getPosX(event) - (progressBarRect?.left || 0)

    if (relativePos < 0) {
      relativePos = 0
    } else if (relativePos > maxRelativePos) {
      relativePos = maxRelativePos
    }

    const duration = getDuration()
    const currentTime = (duration * relativePos) / maxRelativePos

    return {
      currentTime,
      currentTimePos: `${((relativePos / maxRelativePos) * 100).toFixed(2)}%`,
    }
  }

  const handleContextMenu = (event: Event): void => {
    event.preventDefault()
  }

  const handleMouseDownOrTouchStartProgressBar = (event: MouseEvent | TouchEvent): void => {
    event.stopPropagation()
    const { currentTime, currentTimePos } = getCurrentProgress(event)

    if (isFinite(currentTime)) {
      timeOnMouseMove = currentTime
      setState({ isDraggingProgress: true, currentTimePos })

      if (event instanceof MouseEvent) {
        window.addEventListener('mousemove', handleWindowMouseOrTouchMove)
        window.addEventListener('mouseup', handleWindowMouseOrTouchUp)
      } else {
        window.addEventListener('touchmove', handleWindowMouseOrTouchMove)
        window.addEventListener('touchend', handleWindowMouseOrTouchUp)
      }
    }
  }

  const handleWindowMouseOrTouchMove = (event: TouchEvent | MouseEvent): void => {
    if (event instanceof MouseEvent) {
      event.preventDefault()
    }

    event.stopPropagation()
    // Prevent Chrome drag selection bug
    const windowSelection: Selection | null = window.getSelection()
    if (windowSelection && windowSelection.type === 'Range') {
      windowSelection.empty()
    }

    if (state.isDraggingProgress) {
      const { currentTime, currentTimePos } = getCurrentProgress(event)
      timeOnMouseMove = currentTime
      setState({ currentTimePos })
    }
  }

  createEffect(() => {
    if (
      props.audio &&
      props.onSeek &&
      state.isDraggingProgress === false &&
      state.waitingForSeekCallback === true
    ) {
      props.onSeek(props.audio, timeOnMouseMove).then(
        () => setState({ waitingForSeekCallback: false }),
        error => {
          throw new Error(error)
        },
      )
    }
  })

  const handleWindowMouseOrTouchUp = (event: MouseEvent | TouchEvent): void => {
    event.stopPropagation()

    if (!props.audio) {
      return
    }

    const newTime = timeOnMouseMove

    if (props.onSeek) {
      setState({
        isDraggingProgress: false,
        waitingForSeekCallback: true,
      })
    } else {
      const newProps: { isDraggingProgress: boolean; currentTimePos?: string } = {
        isDraggingProgress: false,
      }

      if (
        props.audio.readyState === props.audio.HAVE_NOTHING ||
        props.audio.readyState === props.audio.HAVE_METADATA ||
        !isFinite(newTime)
      ) {
        try {
          props.audio.load()
        } catch (err) {
          newProps.currentTimePos = '0%'
          return props.onChangeCurrentTimeError && props.onChangeCurrentTimeError(err as Error)
        }
      }

      props.audio.currentTime = newTime
      setState(newProps)
    }

    if (event instanceof MouseEvent) {
      window.removeEventListener('mousemove', handleWindowMouseOrTouchMove)
      window.removeEventListener('mouseup', handleWindowMouseOrTouchUp)
    } else {
      window.removeEventListener('touchmove', handleWindowMouseOrTouchMove)
      window.removeEventListener('touchend', handleWindowMouseOrTouchUp)
    }
  }

  const handleAudioTimeUpdate = throttle((event: Event): void => {
    const audio = event.target as HTMLAudioElement
    if (state.isDraggingProgress || state.waitingForSeekCallback === true) return

    const duration = getDuration()

    setState({
      currentTimePos: `${((audio.currentTime / duration) * 100 || 0).toFixed(2)}%`,
    })

    handleAudioDownloadProgressUpdate(event)
  }, props.progressUpdateInterval)

  const handleAudioDownloadProgressUpdate = (event: Event): void => {
    const audio = event.target as HTMLAudioElement
    const duration = getDuration()

    const downloadProgressArr: DownloadProgress[] = []

    for (let i = 0; i < audio.buffered.length; i++) {
      const bufferedStart: number = audio.buffered.start(i)
      const bufferedEnd: number = audio.buffered.end(i)
      downloadProgressArr.push({
        left: `${Math.round((100 / duration) * bufferedStart) || 0}%`,
        width: `${Math.round((100 / duration) * (bufferedEnd - bufferedStart)) || 0}%`,
      })
    }

    clearTimeout(downloadProgressAnimationTimer)
    setState({ downloadProgressArr, hasDownloadProgressAnimation: true })
    downloadProgressAnimationTimer = setTimeout(() => {
      setState({ hasDownloadProgressAnimation: false })
    }, 200)
  }

  const initialize = (): void => {
    if (props.audio && !hasAddedAudioEventListener) {
      audio = props.audio
      hasAddedAudioEventListener = true
      audio.addEventListener('timeupdate', handleAudioTimeUpdate)
      audio.addEventListener('progress', handleAudioDownloadProgressUpdate)
    }
  }

  onMount(() => {
    initialize()
  })

  onCleanup(() => {
    if (audio && hasAddedAudioEventListener) {
      audio.removeEventListener('timeupdate', handleAudioTimeUpdate)
      audio.removeEventListener('progress', handleAudioDownloadProgressUpdate)
    }

    clearTimeout(downloadProgressAnimationTimer)
  })

  createEffect(() => {
    initialize()
  })

  return (
    <div
      class="sap_progress-container"
      ref={props.progressBar}
      aria-label={props.i18nProgressBar}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Number(state.currentTimePos?.split('%')[0])}
      tabIndex={0}
      onMouseDown={handleMouseDownOrTouchStartProgressBar}
      onTouchStart={handleMouseDownOrTouchStartProgressBar}
      onContextMenu={handleContextMenu}
    >
      <div
        classList={{
          ['sap_progress-bar']: true,
          ['sap_progress-bar-show-download']: props.showDownloadProgress,
        }}
      >
        <div class="sap_progress-indicator" style={{ left: state.currentTimePos }} />
        <Show when={props.showFilledProgress}>
          <div class="rhap_progress-filled" style={{ width: state.currentTimePos }} />
        </Show>
        <Show when={props.showDownloadProgress}>
          <For each={state.downloadProgressArr}>
            {({ left, width }) => {
              return (
                <div
                  class="sap_download-progress"
                  style={{
                    left,
                    width,
                    'transition-duration': state.hasDownloadProgressAnimation ? '.2s' : '0s',
                  }}
                />
              )
            }}
          </For>
        </Show>
      </div>
    </div>
  )
}
