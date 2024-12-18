import type { JSX } from 'solid-js'
import { SAP_UI, MAIN_LAYOUT, AUDIO_PRELOAD_ATTRIBUTE, TIME_FORMAT } from './constants'

export type CustomUIModule = SAP_UI | JSX.Element
export type CustomUIModules = Array<CustomUIModule>
export type OnSeek = (audio: HTMLAudioElement, time: number) => Promise<void>

export interface MSEPropsObject {
  onSeek: OnSeek
  onEcrypted?: (e: unknown) => void
  srcDuration: number
}

export interface CurrentTimeProps {
  audio?: HTMLAudioElement
  defaultCurrentTime: JSX.Element
  isLeftTime: boolean
  timeFormat: TIME_FORMAT
}

export interface PlayerProps {
  /**
   * HTML5 Audio tag autoPlay property
   */
  autoPlay?: boolean
  /**
   * Whether to play audio after src prop is changed
   */
  autoPlayAfterSrcChange?: boolean
  /**
   * custom classNames
   */
  className?: string
  /**
   * The time interval to trigger onListen
   */
  listenInterval?: number
  progressJumpStep?: number
  progressJumpSteps?: {
    backward?: number
    forward?: number
  }
  volumeJumpStep?: number
  loop?: boolean
  muted?: boolean
  crossOrigin?: JSX.AudioHTMLAttributes<HTMLAudioElement>['crossOrigin']
  mediaGroup?: string
  hasDefaultKeyBindings?: boolean
  onAbort?: (e: Event) => void
  onCanPlay?: (e: Event) => void
  onCanPlayThrough?: (e: Event) => void
  onEnded?: (e: Event) => void
  onPlaying?: (e: Event) => void
  onSeeking?: (e: Event) => void
  onSeeked?: (e: Event) => void
  onStalled?: (e: Event) => void
  onSuspend?: (e: Event) => void
  onLoadStart?: (e: Event) => void
  onLoadedMetaData?: (e: Event) => void
  onLoadedData?: (e: Event) => void
  onWaiting?: (e: Event) => void
  onEmptied?: (e: Event) => void
  onError?: (e: Event) => void
  onListen?: (e: Event) => void
  onVolumeChange?: (e: Event) => void
  onPause?: (e: Event) => void
  onPlay?: (e: Event) => void
  onClickPrevious?: (e: Event) => void
  onClickNext?: (e: Event) => void
  onPlayError?: (err: Error) => void
  onChangeCurrentTimeError?: (err: Error) => void
  mse?: MSEPropsObject
  /**
   * HTML5 Audio tag preload property
   */
  preload?: AUDIO_PRELOAD_ATTRIBUTE
  /**
   * Pregress indicator refresh interval
   */
  progressUpdateInterval?: number
  /**
   * HTML5 Audio tag src property
   */
  src?: string
  defaultCurrentTime?: JSX.Element
  defaultDuration?: JSX.Element
  volume?: number
  showJumpControls?: boolean
  showSkipControls?: boolean
  showDownloadProgress?: boolean
  showFilledProgress?: boolean
  showFilledVolume?: boolean
  timeFormat?: TIME_FORMAT
  header?: JSX.Element
  footer?: JSX.Element
  customIcons?: CustomIcons
  layout?: MAIN_LAYOUT
  customProgressBarSection?: CustomUIModules
  customControlsSection?: CustomUIModules
  customAdditionalControls?: CustomUIModules
  customVolumeControls?: CustomUIModules
  i18nAriaLabels?: I18nAriaLabels
  children?: JSX.Element
  style?: JSX.CSSProperties
}

export interface CustomIcons {
  play?: JSX.Element
  pause?: JSX.Element
  rewind?: JSX.Element
  forward?: JSX.Element
  previous?: JSX.Element
  next?: JSX.Element
  loop?: JSX.Element
  loopOff?: JSX.Element
  volume?: JSX.Element
  volumeMute?: JSX.Element
}

export interface I18nAriaLabels {
  player?: string
  progressControl?: string
  volumeControl?: string
  play?: string
  pause?: string
  rewind?: string
  forward?: string
  previous?: string
  next?: string
  loop?: string
  loopOff?: string
  volume?: string
  volumeMute?: string
}

export interface ProgressBarProps {
  progressBar?: HTMLDivElement
  audio?: HTMLAudioElement
  progressUpdateInterval: number
  showDownloadProgress: boolean
  showFilledProgress: boolean
  srcDuration?: number
  onSeek?: OnSeek
  onChangeCurrentTimeError?: (err: Error) => void
  i18nProgressBar?: string
}

export interface ProgressBarState {
  isDraggingProgress: boolean
  currentTimePos?: string
  hasDownloadProgressAnimation: boolean
  downloadProgressArr: DownloadProgress[]
  waitingForSeekCallback: boolean
}

export interface DownloadProgress {
  left: string
  width: string
}

export interface TimePosInfo {
  currentTime: number
  currentTimePos: string
}

export interface DurationProps {
  audio?: HTMLAudioElement
  defaultDuration: JSX.Element
  timeFormat: TIME_FORMAT
}

export interface VolumeBarProps {
  audio?: HTMLAudioElement
  volume?: number
  onMuteChange?: () => void
  showFilledVolume: boolean
  i18nVolumeControl?: string
}

export interface VolumePosInfo {
  currentVolume: number
  currentVolumePos: string
}
