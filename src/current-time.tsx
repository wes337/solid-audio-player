import type { JSX } from 'solid-js'
import { createSignal, createEffect, onMount, onCleanup } from 'solid-js'
import { CurrentTimeProps } from './types'
import { getDisplayTimeBySeconds } from './utils'
import { TIME_FORMAT } from './constants'

const getCurrentTime = (audio: HTMLAudioElement, isLeftTime: boolean, timeFormat: TIME_FORMAT) =>
  getDisplayTimeBySeconds(
    isLeftTime ? audio.duration - audio.currentTime : audio.currentTime,
    audio.duration,
    timeFormat,
  )

export default function CurrentTime(props: CurrentTimeProps) {
  const [currentTime, setCurrentTime] = createSignal<JSX.Element>(
    props.audio
      ? getCurrentTime(props.audio, props.isLeftTime, props.timeFormat)
      : props.defaultCurrentTime,
  )

  let audio: HTMLAudioElement | undefined
  let hasAddedAudioEventListener = false

  const handleAudioCurrentTimeChange = (event: Event): void => {
    const audio = event.target as HTMLAudioElement

    const currentTime = getCurrentTime(audio, props.isLeftTime, props.timeFormat)

    setCurrentTime(currentTime || props.defaultCurrentTime)
  }

  const addAudioEventListeners = (): void => {
    if (props.audio && !hasAddedAudioEventListener) {
      audio = props.audio
      hasAddedAudioEventListener = true
      audio.addEventListener('timeupdate', handleAudioCurrentTimeChange)
      audio.addEventListener('loadedmetadata', handleAudioCurrentTimeChange)
    }
  }

  onMount(() => {
    addAudioEventListeners()
  })

  onCleanup(() => {
    if (audio && hasAddedAudioEventListener) {
      audio.removeEventListener('timeupdate', handleAudioCurrentTimeChange)
      audio.removeEventListener('loadedmetadata', handleAudioCurrentTimeChange)
    }
  })

  createEffect(() => {
    addAudioEventListeners()
  })

  return <>{currentTime()}</>
}
