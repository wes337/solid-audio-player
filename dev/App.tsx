import type { Component } from 'solid-js'
import { createSignal, createMemo } from 'solid-js'
import AudioPlayer from 'src'
import 'src/styles.scss'

const CDN_URL = `https://w-img.b-cdn.net/zipp`

const App: Component = () => {
  const [currentTrack, setTrackIndex] = createSignal(0)

  const handleClickNext = () => {
    setTrackIndex(currentTrack => (currentTrack < playlist.length - 1 ? currentTrack + 1 : 0))
  }

  const handleEnd = () => {
    setTrackIndex(currentTrack => (currentTrack < playlist.length - 1 ? currentTrack + 1 : 0))
  }

  const src = createMemo(() => `${CDN_URL}/music/${playlist[currentTrack()]}`)

  return (
    <div>
      <AudioPlayer
        header={
          <div>
            <div>{playlist[currentTrack()]}</div>
          </div>
        }
        volume={0.5}
        src={src()}
        showSkipControls
        onClickNext={handleClickNext}
        onEnded={handleEnd}
      />
    </div>
  )
}

const playlist = [
  '20140425_[CLIP] Enter Framework.mp3',
  '20140723_҉      ҉   T B H ~   ft. oklou.mp3',
  '20141005_SEE U UP THERE.mp3',
  '20141223_RIDE W ME (SNIP).mp3',
  '20150220_LiL GUCCI MIDS🍕 - 🍷🐩UPPERCASE BO$$🍻🐶 (PROD. BY LEE TENSEI)👹.mp3',
  '20150227_BERLIN [SS001].mp3',
  '20160706_AINT SHIT CHANGED (prod. DAYZO X KAPE).mp3',
  '20160910_FREAKY KNIFE ...mp3',
  '20160910_MONEY ...mp3',
  '20170114_STEVIE FRANCHISE & TUNDRA2K - THE JACKPOT.mp3',
  '20170307_Clarity (visual in description).mp3',
  '20170716_BIBLE BELT ...mp3',
  "20170904_Sincere • Untouchable Like Air [Part 2] • It's a Go • INTUITION² • DENIM.mp3",
  '20170904_SpaceGhostPurrp - Over Kill aka POSSESSED 2.mp3',
  '20180223_P2TheGoldMa$k - Logan Paul [Prod. OgGeo] (Hosted by DJ Sweendawg) ＊REEL BUMP EXCLUSIVE＊.mp3',
  '20180304_CONTACT LENS - AUTOMATIC TRANSACTION.mp3',
  '20180406_Hot Chocolate.mp3',
  '20180420_ucarly inc..mp3',
  '20180630_RETAIL ...mp3',
  '20190605_Dion - Benign (Prod. b9tum0r).mp3',
  '20200327_IIIII - Leaves.mp3',
  '20200527_PROGRAM [prod. DJ Birdo] ＊VIDEO IN DESC＊.mp3',
  '20200901_no talking [prod. cashcache].mp3',
  "20201011_don't care about the cost [ft. sixmusic & despair].mp3",
  '20201108_Bad Day ＊no auto＊ prod. ahtrent.mp3',
  '20201118_5starcrys x cryingface - DOPE.mp3',
  '20201205_leaves.mp3',
  '20201219_DVSTRR VS AYECHRIS #Bioteam.mp3',
  '20210203_dont lose [prod ikesmissing].mp3',
  '20220204_samething (prod.shotti+rumfield).mp3',
  '20220214_Speed Boat Wet Prod Smash29k, Fookkitt, Afxxlings, Goals Mister  (Laker, Tacxin)).mp3',
  '20230207_WARTHOG (Hosted by DJ SMOKEY+SHaDOwWiZArdMoNEyGANG)p.bicflame.mp3',
  '20240105_BL0CK M3, D0Иꓕ Ⅎ0LL0V M3.mp3',
  '20240508_Keep It a Buck [Ice Spice - In Ha Mood x Bicflame - I Must Train Now].mp3',
  '@corigula fuck ass beat150bpm.mp3',
  'Administer - No more.mp3',
  'Administer - Rufus.mp3',
  'deject - cool guy lounge.mp3',
  'jackson bentley - XF15.mp3',
  'lxpn mellow light.mp3',
  'lxpn-behind glazed eyes.mp3',
  'lxpn-long wait.mp3',
  'lxpn-muted .mp3',
  'paul drafts - hazyslowlofibit.mp3',
  'paul drafts - pad pods.mp3',
  'paul drafts - sorrowful.mp3',
  'paul drafts - spheric beams.mp3',
  'RikkiTikkiTemb0- Silicon Marauder.mp3',
  'ry - untirtled#1.mp3',
  'ry - untitled#23.mp3',
  'ry - untitled#28.mp3',
  'Sigma- Antonios Delight.mp3',
  'teckdeck - headache.mp3',
  'TESTSURGER.mp3',
]

export default App
