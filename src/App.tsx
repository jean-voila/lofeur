import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Radio,
  AudioLines,
  Timer,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  ExternalLink,
  X,
  Sun,
  Moon,
  Maximize,
  Minimize,
  Menu,
  SlidersHorizontal,
  RotateCcw,
  Square,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Search,
  Headphones,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  Coffee,
  Info,
  Video,
  VideoOff,
  Palette,
  Languages,
} from "lucide-react";
import defaults from "./catalog";
import { assetUrl } from "./site";
import { seoCopy } from "./seo-content";
import { useNowPlaying } from "./now-playing";
import {
  advanceTimer,
  backgrounds,
  duration,
  isStations,
  load,
  reference,
  save,
  sounds,
  youtubeId,
  validAudioUrl,
  audioSource,
  type Station,
} from "./lib";
import { useRadio } from "./use-radio";
import {
  migrateCatalog,
  sortStations,
  stationState,
  useStationHealth,
} from "./station-health";
import { useI18n, locales } from "./i18n";
import ProceduralScene, {
  initialScene,
  validScene,
  type SceneOptions,
} from "./ProceduralScene";
import SceneSettings from "./SceneSettings";
type TimerState = {
  phase: number;
  remaining: number;
  deadline: number | null;
  deep: boolean;
};
function useSaved<T>(key: string, initial: T, valid?: (x: unknown) => boolean) {
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  // The first render matches the static HTML; saved preferences restore after hydration.
  useEffect(() => {
    setValue(load(key, initial, valid));
    setRestored(true);
  }, [key]);
  useEffect(() => {
    if (restored) save(key, value);
  }, [key, value, restored]);
  return [value, setValue] as const;
}
const numberRecord = (x: unknown) =>
  !!x &&
  typeof x === "object" &&
  !Array.isArray(x) &&
  Object.values(x).every((v) => typeof v === "number" && v >= 0 && v <= 100);
const strings = (x: unknown) =>
  Array.isArray(x) && x.every((v) => typeof v === "string");
const validTimer = (x: unknown) => {
  const t = x as TimerState;
  return (
    !!t &&
    Number.isInteger(t.phase) &&
    t.phase >= 1 &&
    t.phase <= 8 &&
    Number.isFinite(t.remaining) &&
    t.remaining >= 0 &&
    t.remaining <= 3000 &&
    (t.deadline === null || Number.isFinite(t.deadline)) &&
    typeof t.deep === "boolean"
  );
};
function IconButton({
  label,
  children,
  active,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""} ${className}`}
      title={label}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}
function Waves({ playing }: { playing: boolean }) {
  return (
    <span className={`waves ${playing ? "moving" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
function Cover({ station }: { station: Station }) {
  return (
    <img
      src={
        station.cover ||
        `https://i.ytimg.com/vi/${youtubeId(station.url)}/hqdefault.jpg`
      }
      alt=""
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = assetUrl("favicon.svg");
      }}
    />
  );
}
export default function App() {
  const { t, locale, setLocale } = useI18n();
  const [video, setVideo] = useSaved(
    "video-enabled",
    false,
    (x) => typeof x === "boolean",
  );
  const [sceneOptions, setSceneOptions] = useSaved<SceneOptions>(
    "scene",
    initialScene,
    validScene,
  );
  const [sceneSettings, setSceneSettings] = useState(false);
  const [stations, setStations] = useSaved<Station[]>(
    "stations",
    defaults,
    isStations,
  );
  const [selected, setSelected] = useSaved(
    "selected",
    defaults[0].id,
    (x) => typeof x === "string",
  );
  const catalogHealth = useStationHealth();
  const [visibleStations, setVisibleStations] = useState(24);
  useEffect(() => {
    const known = load<string[]>("catalog-known-ids", []);
    const unseen = defaults.filter((s) => !known.includes(s.id));
    setStations((current) => migrateCatalog(current, unseen));
    save(
      "catalog-known-ids",
      defaults.map((s) => s.id),
    );
    save("catalog-version", 2);
  }, [setStations]);
  const station = stations.find((s) => s.id === selected) || stations[0];
  const [theme, setTheme] = useSaved<"dark" | "light">(
    "theme",
    "dark",
    (x) => x === "light" || x === "dark",
  );
  const [volume, setVolume] = useSaved(
    "volume",
    50,
    (x) => typeof x === "number" && x >= 0 && x <= 100,
  );
  const [muted, setMuted] = useSaved(
    "muted",
    false,
    (x) => typeof x === "boolean",
  );
  const [liked, setLiked] = useSaved<string[]>("favorites", [], strings);
  const [soundLiked, setSoundLiked] = useSaved<string[]>(
    "sound-favorites",
    [],
    strings,
  );
  const [soundVolumes, setSoundVolumes] = useSaved<Record<string, number>>(
    "sound-volumes",
    {},
    numberRecord,
  );
  const [master, setMaster] = useSaved(
    "ambient-master",
    75,
    (x) => typeof x === "number" && x >= 0 && x <= 100,
  );
  const [timerVisible, setTimerVisible] = useSaved(
    "timer-visible",
    true,
    (x) => typeof x === "boolean",
  );
  const [timer, setTimer] = useSaved<TimerState>(
    "timer",
    { phase: 1, remaining: 1500, deadline: null, deep: false },
    validTimer,
  );
  const [alarmVolume, setAlarmVolume] = useSaved(
    "alarm-volume",
    40,
    (x) => typeof x === "number" && x >= 0 && x <= 100,
  );
  const [consent, setConsent] = useSaved(
    "youtube-consent",
    false,
    (x) => typeof x === "boolean",
  );
  const [panel, setPanel] = useState<"stations" | "sounds" | null>(null);
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const [about, setAbout] = useState(false);
  const [zen, setZen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  useEffect(() => setVisibleStations(24), [query, favoritesOnly]);
  const [edit, setEdit] = useState<Station | "new" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [soundActive, setSoundActive] = useState<string[]>([]);
  const radio = useRadio(station, video, consent, volume, muted);
  const song = useNowPlaying(station, radio.requested);
  const { playing, loading, error, title, host: playerHost } = radio;
  const currentStationState = stationState(
    station,
    video,
    catalogHealth.health,
    catalogHealth.failed(station, video),
  );
  useEffect(() => {
    if (radio.unavailable) catalogHealth.mark(station, video, true);
    else if (playing) catalogHealth.mark(station, video, false);
  }, [radio.unavailable, playing, station.url, video, catalogHealth.mark]);
  const audios = useRef(new Map<string, HTMLAudioElement>());
  const importRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const modalOpen = !!edit || about;
  useEffect(() => {
    if (modalOpen && !modalRef.current?.open) {
      lastFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.showModal();
    } else if (!modalOpen && modalRef.current?.open) {
      modalRef.current.close();
      lastFocus.current?.focus();
    }
  }, [modalOpen]);
  useEffect(() => {
    for (const [id, audio] of audios.current)
      audio.volume = (((soundVolumes[id] ?? 50) / 100) * master) / 100;
  }, [master, soundVolumes]);
  useEffect(
    () => () => {
      for (const audio of audios.current.values()) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    },
    [],
  );
  useEffect(() => {
    if (!timer.deadline) return;
    const tick = () =>
      setTimer((current) => {
        if (!current.deadline) return current;
        const next = advanceTimer(
          current.phase,
          current.deadline,
          Date.now(),
          current.deep,
        );
        if (
          next.phase === current.phase &&
          next.remaining === current.remaining &&
          !next.complete
        )
          return current;
        if (next.phase !== current.phase || next.complete) {
          const alarm = new Audio(
            `${reference}/sounds/pomodoro/${next.complete ? "complete" : "phase"}.mp3`,
          );
          alarm.volume = alarmVolume / 100;
          void alarm.play().catch(() => {});
          setNotice(
            next.complete
              ? t("Belle session. Votre cycle est terminé !")
              : next.phase % 2 === 0
                ? t("C’est l’heure de souffler. Bonne pause !")
                : t("On reprend en douceur."),
          );
        }
        return {
          ...current,
          phase: next.phase,
          deadline: next.deadline,
          remaining: next.remaining,
        };
      });
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timer.deadline, alarmVolume, setTimer, t]);
  useEffect(() => {
    document.title = timer.deadline
      ? `${formatTime(timer.remaining)} · lofeur`
      : seoCopy[locale].title;
  }, [timer.remaining, timer.deadline, locale]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);
  function changeVideo(enabled: boolean) {
    if (enabled && radio.requested) setConsent(true);
    setVideo(enabled);
  }
  function togglePlay() {
    if (playing || loading) radio.pause();
    else {
      if (video && !consent) setConsent(true);
      radio.play();
    }
  }
  function choose(s: Station) {
    if (video && !consent) setConsent(true);
    setSelected(s.id);
    radio.play();
  }
  function skip(dir: number) {
    const available = sortStations(
      stations,
      video,
      catalogHealth.health,
      liked,
    ).filter(
      (s) =>
        !stationState(
          s,
          video,
          catalogHealth.health,
          catalogHealth.failed(s, video),
        ).unavailable,
    );
    if (!available.length) return;
    const index = available.findIndex((s) => s.id === station.id);
    choose(
      available[
        (Math.max(0, index) + dir + available.length) % available.length
      ],
    );
  }
  function toggleLike(id: string, sound = false) {
    const setter = sound ? setSoundLiked : setLiked;
    setter((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }
  function togglePanel(next: "stations" | "sounds") {
    setPanel((current) => (current === next ? null : next));
    setQuery("");
    setFavoritesOnly(false);
  }
  function releaseSound(id: string) {
    const audio = audios.current.get(id);
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audios.current.delete(id);
    }
  }
  async function toggleSound(id: string) {
    if (soundActive.includes(id)) {
      releaseSound(id);
      setSoundActive((x) => x.filter((s) => s !== id));
      return;
    }
    const sound = sounds.find((s) => s[0] === id)!;
    let audio = audios.current.get(id);
    if (!audio) {
      audio = new Audio(`${reference}/sounds/soundscapes/${sound[2]}.wav`);
      audio.loop = true;
      audio.preload = "none";
      audios.current.set(id, audio);
    }
    audio.volume = (((soundVolumes[id] ?? 50) / 100) * master) / 100;
    try {
      await audio.play();
      setSoundActive((x) => (x.includes(id) ? x : [...x, id]));
    } catch {
      releaseSound(id);
      setNotice(
        t(
          "Impossible de lire « {name} ». Vérifiez votre connexion puis réessayez.",
          { name: t(sound[1]) },
        ),
      );
    }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice(t("Le plein écran n’est pas disponible dans ce navigateur."));
    }
  }
  function resetPhase() {
    setTimer((t) => ({
      ...t,
      deadline: null,
      remaining: duration(t.phase, t.deep),
    }));
  }
  function resetCycle() {
    setTimer((t) => ({
      ...t,
      phase: 1,
      deadline: null,
      remaining: duration(1, t.deep),
    }));
  }
  function toggleTimer() {
    setTimer((t) =>
      t.deadline
        ? {
            ...t,
            remaining: Math.max(0, Math.ceil((t.deadline - Date.now()) / 1000)),
            deadline: null,
          }
        : { ...t, deadline: Date.now() + t.remaining * 1000 },
    );
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        (e.target as HTMLElement).closest("input, textarea, select, dialog") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.key === "Escape") {
        setZen(false);
        setPanel(null);
        setMenu(false);
        setSettings(false);
        setSceneSettings(false);
        document.querySelector(".site-guide")?.removeAttribute("open");
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key.toLowerCase() === "f") void toggleFullscreen();
      if (e.key.toLowerCase() === "h") setZen((z) => !z);
      if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  function exportStations() {
    const blob = new Blob([JSON.stringify(stations, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lofeur-stations.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importStations(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error();
      const data = JSON.parse(await file.text());
      if (!isStations(data)) throw new Error();
      setStations(data.map((s) => ({ ...s, cover: safeImage(s.cover) })));
      setSelected(data[0].id);
      setNotice(t("{count} stations importées.", { count: data.length }));
    } catch {
      setNotice(
        t(
          "Fichier invalide : utilisez un export lofeur avec 1 à 250 stations YouTube valides et des identifiants uniques.",
        ),
      );
    }
    if (importRef.current) importRef.current.value = "";
  }
  const stationList = sortStations(
    stations.filter(
      (s) =>
        (!favoritesOnly || liked.includes(s.id)) &&
        `${s.name} ${s.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ),
    video,
    catalogHealth.health,
    liked,
    (s) => catalogHealth.failed(s, video),
  );
  const soundList = [...sounds]
    .filter(
      (s) =>
        (!favoritesOnly || soundLiked.includes(s[0])) &&
        t(s[1]).toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(soundLiked.includes(b[0])) - Number(soundLiked.includes(a[0])),
    );
  const phaseLabel =
    timer.phase % 2 === 1
      ? t("Concentration")
      : timer.phase === 8
        ? t("Longue pause")
        : t("Petite pause");
  return (
    <main className={`desk ${zen ? "zen" : ""}`}>
      {video ? (
        <img
          className="scene"
          src={backgrounds[theme]}
          alt={t(
            "Un bureau chaleureux, une fenêtre sur la ville et un chat endormi",
          )}
        />
      ) : (
        <ProceduralScene options={sceneOptions} />
      )}
      {video && (
        <div
          className={`video-scene ${radio.ready && !error ? "is-visible" : ""} ${!playing ? "is-waiting" : ""}`}
          ref={playerHost}
          aria-label={t("Lecteur vidéo YouTube")}
        />
      )}
      <div className="scene-shade" />
      <header className="topbar ui">
        <a className="brand" href={assetUrl("")} aria-label="lofeur, accueil">
          <img
            className="wordmark"
            src={assetUrl("logo.svg")}
            alt="lofeur"
            width="184"
            height="54"
          />
        </a>
        <div className="top-actions">
          <label className="language-control glass">
            <Languages size={17} />
            <select
              aria-label={t("Langue")}
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
            >
              {locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <IconButton
            label={video ? t("Désactiver la vidéo") : t("Activer la vidéo")}
            active={video}
            aria-pressed={video}
            onClick={() => changeVideo(!video)}
          >
            {video ? <Video /> : <VideoOff />}
          </IconButton>
          <IconButton
            label={t("Apparence du fond")}
            active={sceneSettings}
            aria-expanded={sceneSettings}
            onClick={() => setSceneSettings((v) => !v)}
          >
            <Palette />
          </IconButton>
          <IconButton
            className="fullscreen-control"
            label={
              fullscreen ? t("Quitter le plein écran") : t("Plein écran (F)")
            }
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize /> : <Maximize />}
          </IconButton>
          <IconButton
            className="theme-control"
            label={
              theme === "dark" ? t("Passer au jour") : t("Passer à la nuit")
            }
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </IconButton>
          <IconButton
            className="zen-control"
            label={t("Masquer l’interface (H)")}
            onClick={() => setZen(true)}
          >
            <EyeOff />
          </IconButton>
          <IconButton
            label={t("Menu")}
            active={menu}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            <Menu />
          </IconButton>
        </div>
      </header>
      {menu && (
        <nav className="menu glass ui" aria-label={t("Réglages du bureau")}>
          <button
            onClick={() => {
              setTheme((v) => (v === "dark" ? "light" : "dark"));
              setMenu(false);
            }}
          >
            <Sun />
            {t(theme === "dark" ? "Passer au jour" : "Passer à la nuit")}
          </button>
          <button
            onClick={() => {
              setZen(true);
              setMenu(false);
            }}
          >
            <EyeOff />
            {t("Masquer l’interface")}
          </button>
          <button
            onClick={() => {
              setPanel("stations");
              setMenu(false);
            }}
          >
            <Radio />
            {t("Gérer mes stations")}
          </button>
          <button
            onClick={() => {
              setTimerVisible((v) => !v);
              setMenu(false);
            }}
          >
            <Timer />
            {timerVisible
              ? t("Masquer le Pomodoro")
              : t("Afficher le Pomodoro")}
          </button>
          <button
            onClick={() => {
              setAbout(true);
              setMenu(false);
            }}
          >
            <Info />
            {t("À propos & raccourcis")}
          </button>
          <button
            onClick={() => {
              radio.pause();
              setConsent(false);
              setMenu(false);
              setNotice(t("La radio est arrêtée."));
            }}
          >
            <Square />
            {t("Arrêter la radio")}
          </button>
        </nav>
      )}
      <section
        className="now-playing glass ui"
        aria-label={t("Station actuelle")}
      >
        <div className="now-cover">
          <Cover
            station={
              !radio.requested
                ? { ...station, cover: assetUrl("favicon.svg") }
                : song?.art
                  ? { ...station, cover: song.art }
                  : station
            }
          />
        </div>
        <div className="now-copy">
          <span className="muted small">{t("À l’écoute")}</span>
          <h2>{song?.artist || station.name}</h2>
          <p title={song?.title || title || station.description}>
            {song?.title || title || station.description}
          </p>
        </div>
        <Waves playing={playing} />
      </section>
      {(!video || !consent) && !radio.requested && (
        <div className="welcome-play ui">
          <button className="glass start-listening" onClick={togglePlay}>
            <Play fill="currentColor" />
            {t("Entrer dans ma bulle")}{" "}
            <span>
              {video ? t("Écouter avec YouTube") : t("Audio seul · mode léger")}
            </span>
          </button>
          <small>
            {video
              ? t(
                  "En lançant la radio, vous activez le lecteur YouTube et ses cookies.",
                )
              : t("Sans vidéo, sans lecteur YouTube. Juste la musique.")}
          </small>
        </div>
      )}
      {video && consent && !playing && !error && !(radio.ready && loading) && (
        <button
          className="center-play glass ui"
          aria-label={
            loading ? t("Chargement du lecteur") : t("Lancer la radio")
          }
          disabled={loading}
          onClick={togglePlay}
        >
          {loading ? <span className="loader" /> : <Play fill="currentColor" />}
        </button>
      )}
      {error && (
        <div className="player-error glass ui" role="alert">
          <p>{t(error)}</p>
          <div>
            <button
              className="text-button"
              onClick={() => {
                radio.play();
              }}
            >
              {t("Réessayer")}
            </button>
            {!video && !audioSource(station) && (
              <button className="text-button" onClick={() => changeVideo(true)}>
                {t("Activer la vidéo")}
              </button>
            )}
            <a href={station.url} target="_blank" rel="noreferrer">
              {t("Ouvrir sur YouTube")}
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
      {sceneSettings && (
        <SceneSettings
          video={video}
          options={sceneOptions}
          setOptions={setSceneOptions}
          onClose={() => setSceneSettings(false)}
        />
      )}
      <div className="left-dock ui">
        {panel && (
          <section
            className="browser-panel glass"
            aria-label={
              panel === "stations" ? t("Stations") : t("Ambiances sonores")
            }
          >
            <div className="panel-header">
              <div>
                <h2>
                  {panel === "stations" ? <Radio /> : <AudioLines />}
                  {panel === "stations"
                    ? t("Stations")
                    : t("Ambiances sonores")}
                </h2>
                <p>
                  {panel === "stations"
                    ? t("À chaque humeur, sa fréquence.")
                    : t("Composez votre petit coin de calme.")}
                </p>
              </div>
              <IconButton
                label={t("Fermer le panneau")}
                onClick={() => setPanel(null)}
              >
                <X />
              </IconButton>
            </div>
            <div className="panel-tools">
              <label className="search">
                <Search size={16} />
                <input
                  aria-label={t("Rechercher")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Rechercher…")}
                />
              </label>
              <IconButton
                label={t("Afficher les favoris")}
                active={favoritesOnly}
                aria-pressed={favoritesOnly}
                onClick={() => setFavoritesOnly((x) => !x)}
              >
                <Heart fill={favoritesOnly ? "currentColor" : "none"} />
              </IconButton>
              {panel === "stations" && (
                <IconButton
                  label={t(
                    catalogHealth.checking
                      ? "Vérification en cours…"
                      : "Vérifier les stations",
                  )}
                  onClick={catalogHealth.refresh}
                >
                  <RotateCcw />
                </IconButton>
              )}
              {panel === "stations" && (
                <IconButton
                  label={t("Ajouter une station")}
                  disabled={stations.length >= 250}
                  onClick={() => setEdit("new")}
                >
                  <Plus />
                </IconButton>
              )}
            </div>
            <div className="panel-scroll">
              {panel === "stations"
                ? stationList.slice(0, visibleStations).map((s) => (
                    <article
                      className={`station-row ${s.id === station.id ? "selected" : ""} ${stationState(s, video, catalogHealth.health, catalogHealth.failed(s, video)).unavailable ? "unavailable" : ""}`}
                      key={s.id}
                    >
                      <button
                        className="station-select"
                        disabled={
                          stationState(
                            s,
                            video,
                            catalogHealth.health,
                            catalogHealth.failed(s, video),
                          ).unavailable
                        }
                        onClick={() => choose(s)}
                        aria-label={t("Écouter {name}", { name: s.name })}
                        aria-pressed={s.id === station.id}
                      >
                        <div className="station-cover">
                          <Cover station={s} />
                          {s.id === station.id && playing && <Waves playing />}
                        </div>
                        <div>
                          <h3>
                            {stationState(s, video, catalogHealth.health)
                              .live && (
                              <span
                                className="live-dot"
                                role="img"
                                aria-label={t("En direct")}
                              />
                            )}{" "}
                            <span className="station-name">{s.name}</span>
                          </h3>
                          {stationState(
                            s,
                            video,
                            catalogHealth.health,
                            catalogHealth.failed(s, video),
                          ).unavailable ? (
                            <span className="station-state">
                              {t("Indisponible")}
                            </span>
                          ) : stationState(s, video, catalogHealth.health)
                              .requiresVideo ? (
                            <span className="station-state">
                              {t("Vidéo YouTube requise")}
                            </span>
                          ) : null}
                          <p>
                            {s.description || t("Votre fréquence personnelle")}
                          </p>
                        </div>
                      </button>
                      <div className="row-actions">
                        <IconButton
                          label={t("Favori : {name}", { name: s.name })}
                          aria-pressed={liked.includes(s.id)}
                          active={liked.includes(s.id)}
                          onClick={() => toggleLike(s.id)}
                        >
                          <Heart
                            fill={
                              liked.includes(s.id) ? "currentColor" : "none"
                            }
                          />
                        </IconButton>
                        <IconButton
                          label={t("Modifier {name}", { name: s.name })}
                          onClick={() => {
                            setDeleteId(null);
                            setEdit(s);
                          }}
                        >
                          <Pencil />
                        </IconButton>
                      </div>
                    </article>
                  ))
                : soundList.map((s) => (
                    <article
                      className={`sound-row ${soundActive.includes(s[0]) ? "selected" : ""}`}
                      key={s[0]}
                    >
                      <button
                        className="sound-toggle"
                        aria-label={t(
                          soundActive.includes(s[0])
                            ? "Arrêter {name}"
                            : "Écouter {name}",
                          { name: t(s[1]) },
                        )}
                        aria-pressed={soundActive.includes(s[0])}
                        onClick={() => toggleSound(s[0])}
                      >
                        <img
                          src={`${reference}/images/${s[3]}.webp`}
                          alt=""
                          loading="lazy"
                        />
                        {soundActive.includes(s[0]) ? (
                          <Pause fill="currentColor" />
                        ) : (
                          <Play fill="currentColor" />
                        )}
                      </button>
                      <div className="sound-controls">
                        <div>
                          <h3>{t(s[1])}</h3>
                          <IconButton
                            label={t("Favori : {name}", { name: t(s[1]) })}
                            active={soundLiked.includes(s[0])}
                            aria-pressed={soundLiked.includes(s[0])}
                            onClick={() => toggleLike(s[0], true)}
                          >
                            <Heart
                              fill={
                                soundLiked.includes(s[0])
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </IconButton>
                        </div>
                        <input
                          type="range"
                          aria-label={t("Volume {name}", { name: t(s[1]) })}
                          min="0"
                          max="100"
                          value={soundVolumes[s[0]] ?? 50}
                          onChange={(e) =>
                            setSoundVolumes((v) => ({
                              ...v,
                              [s[0]]: +e.target.value,
                            }))
                          }
                        />
                      </div>
                    </article>
                  ))}
              {panel === "stations" && stationList.length > visibleStations && (
                <button
                  className="load-more text-button"
                  onClick={() => setVisibleStations((n) => n + 24)}
                >
                  {t("Afficher plus ({count})", {
                    count: stationList.length - visibleStations,
                  })}
                </button>
              )}
              {(panel === "stations"
                ? stationList.length
                : soundList.length) === 0 && (
                <p className="empty">
                  {favoritesOnly
                    ? t("Ajoutez vos premiers favoris avec le cœur.")
                    : t("Aucun résultat. Essayez un autre mot.")}
                </p>
              )}
            </div>
            {panel === "stations" ? (
              <div className="panel-footer">
                <button onClick={exportStations}>
                  <Download />
                  {t("Exporter")}
                </button>
                <button onClick={() => importRef.current?.click()}>
                  <Upload />
                  {t("Importer")}
                </button>
                <button
                  onClick={() => setConfirmReset((v) => !v)}
                  title={t("Restaurer les stations d’origine")}
                >
                  <RotateCcw />
                </button>
                {confirmReset && (
                  <div className="reset-confirm">
                    <p>
                      {t("Remplacer vos stations par le catalogue d’origine ?")}
                    </p>
                    <button
                      onClick={() => {
                        setStations(defaults);
                        setSelected(defaults[0].id);
                        setConfirmReset(false);
                      }}
                    >
                      {t("Restaurer")}
                    </button>
                    <button onClick={() => setConfirmReset(false)}>
                      {t("Annuler")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ambient-master">
                <Volume2 size={17} />
                <input
                  type="range"
                  aria-label={t("Volume général des ambiances")}
                  value={master}
                  min="0"
                  max="100"
                  onChange={(e) => setMaster(+e.target.value)}
                />
                <button
                  onClick={() => {
                    for (const id of audios.current.keys()) releaseSound(id);
                    setSoundActive([]);
                  }}
                >
                  {t("Tout arrêter")}
                </button>
              </div>
            )}
          </section>
        )}
        <section
          className="radio-player glass"
          aria-label={t("Commandes de la radio")}
        >
          <div className="radio-top">
            {currentStationState.live && (
              <span
                className="live-dot"
                role="img"
                aria-label={t("En direct")}
              />
            )}
            <strong>
              {loading
                ? t("Connexion…")
                : playing
                  ? t(currentStationState.live ? "En direct" : "À l’écoute")
                  : t("Prêt à écouter")}
            </strong>
            <div className="radio-top-actions">
              <IconButton
                label={t("Station favorite")}
                active={liked.includes(station.id)}
                aria-pressed={liked.includes(station.id)}
                onClick={() => toggleLike(station.id)}
              >
                <Heart
                  fill={liked.includes(station.id) ? "currentColor" : "none"}
                />
              </IconButton>
              <a
                className="icon-button"
                title={t("Ouvrir la station sur YouTube")}
                aria-label={t("Ouvrir la station sur YouTube")}
                href={station.url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink />
              </a>
            </div>
          </div>
          <div className="radio-controls">
            <IconButton
              label={t("Station précédente")}
              onClick={() => skip(-1)}
            >
              <SkipBack fill="currentColor" />
            </IconButton>
            <IconButton
              label={playing ? t("Mettre en pause") : t("Écouter la radio")}
              disabled={loading}
              onClick={togglePlay}
            >
              {playing ? (
                <Pause fill="currentColor" />
              ) : (
                <Play fill="currentColor" />
              )}
            </IconButton>
            <IconButton label={t("Station suivante")} onClick={() => skip(1)}>
              <SkipForward fill="currentColor" />
            </IconButton>
            <span className="control-spacer" />
            <IconButton
              label={muted ? t("Rétablir le son (M)") : t("Couper le son (M)")}
              onClick={() => setMuted((x) => !x)}
            >
              {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </IconButton>
            <input
              type="range"
              aria-label={t("Volume de la radio")}
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                setVolume(+e.target.value);
                setMuted(false);
              }}
            />
          </div>
        </section>
        <div className="dock-buttons">
          <button
            className={`glass ${panel === "stations" ? "active" : ""}`}
            aria-expanded={panel === "stations"}
            onClick={() => togglePanel("stations")}
          >
            <Radio />
            {t("Stations")}
          </button>
          <button
            className={`glass ${panel === "sounds" ? "active" : ""}`}
            aria-expanded={panel === "sounds"}
            onClick={() => togglePanel("sounds")}
          >
            <AudioLines />
            {t("Ambiances")}
            {soundActive.length > 0 && (
              <span className="count">{soundActive.length}</span>
            )}
          </button>
        </div>
      </div>
      {timerVisible && (
        <section className="pomodoro glass ui" aria-label={t("Pomodoro")}>
          <div className="timer-header">
            <span className="timer-symbol">
              {timer.phase % 2 === 1 ? <Timer /> : <Coffee />}
            </span>
            <h2>{t(phaseLabel)}</h2>
            <span className="phase-count">{timer.phase} / 8</span>
            <IconButton
              label={t("Masquer le Pomodoro")}
              onClick={() => setTimerVisible(false)}
            >
              <X />
            </IconButton>
          </div>
          <div
            className="timer-display"
            role="timer"
            aria-label={`${t(phaseLabel)} : ${formatTime(timer.remaining)}`}
          >
            {formatTime(timer.remaining)}
          </div>
          <div
            className="phase-track"
            role="group"
            aria-label={t("Phase {phase} sur 8", { phase: timer.phase })}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <span
                key={i}
                className={`${i < timer.phase - 1 ? "done" : ""} ${i === timer.phase - 1 ? "current" : ""}`}
              >
                <i
                  style={{
                    width:
                      i === timer.phase - 1
                        ? `${100 * (1 - timer.remaining / duration(timer.phase, timer.deep))}%`
                        : "100%",
                  }}
                />
              </span>
            ))}
          </div>
          <div className="timer-buttons">
            <IconButton
              label={
                timer.deadline
                  ? t("Mettre le minuteur en pause")
                  : t("Démarrer le minuteur")
              }
              onClick={toggleTimer}
            >
              {timer.deadline ? (
                <Pause fill="currentColor" />
              ) : (
                <Play fill="currentColor" />
              )}
            </IconButton>
            <IconButton
              label={t("Réinitialiser cette phase")}
              onClick={resetPhase}
            >
              <Square fill="currentColor" />
            </IconButton>
            <IconButton label={t("Recommencer le cycle")} onClick={resetCycle}>
              <RotateCcw />
            </IconButton>
            <IconButton
              label={t("Réglages du Pomodoro")}
              active={settings}
              aria-expanded={settings}
              onClick={() => setSettings((x) => !x)}
            >
              <SlidersHorizontal />
            </IconButton>
          </div>
          {settings && (
            <div className="timer-settings">
              <label>
                {t("Votre rythme")}
                <select
                  value={timer.deep ? "deep" : "focus"}
                  onChange={(e) => {
                    const deep = e.target.value === "deep";
                    setTimer({
                      phase: 1,
                      remaining: duration(1, deep),
                      deep,
                      deadline: null,
                    });
                  }}
                >
                  <option value="focus">{t("Classique · 25 / 5 min")}</option>
                  <option value="deep">{t("Long · 50 / 10 min")}</option>
                </select>
                <ChevronDown size={14} />
              </label>
              <label>
                {t("Volume de l’alarme")}
                <input
                  type="range"
                  aria-label={t("Volume de l’alarme")}
                  min="0"
                  max="100"
                  value={alarmVolume}
                  onChange={(e) => setAlarmVolume(+e.target.value)}
                />
              </label>
              <p>
                {t("4 sessions, puis une pause de {minutes} minutes.", {
                  minutes: timer.deep ? 20 : 15,
                })}
              </p>
            </div>
          )}
        </section>
      )}
      <div className="right-dock ui">
        <button
          className={`glass icon-button ${timerVisible ? "active" : ""}`}
          aria-label={t("Afficher ou masquer le Pomodoro")}
          title={t("Pomodoro")}
          aria-pressed={timerVisible}
          onClick={() => setTimerVisible((v) => !v)}
        >
          <Timer />
        </button>
      </div>
      <button
        className="restore-ui glass icon-button"
        title={t("Afficher l’interface (H)")}
        aria-label={t("Afficher l’interface")}
        onClick={() => setZen(false)}
      >
        <Eye />
      </button>
      {notice && (
        <div className="toast glass" role="status">
          <Headphones size={18} />
          <p>{notice}</p>
          <IconButton
            label={t("Fermer la notification")}
            onClick={() => setNotice("")}
          >
            <X />
          </IconButton>
        </div>
      )}
      <input
        hidden
        ref={importRef}
        type="file"
        accept="application/json,.json"
        aria-label={t("Importer des stations")}
        onChange={(e) => importStations(e.target.files?.[0])}
      />
      <dialog
        ref={modalRef}
        aria-label={edit ? t("Gestion des stations") : t("À propos de lofeur")}
        className="modal glass"
        onCancel={() => {
          setEdit(null);
          setAbout(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEdit(null);
            setAbout(false);
          }
        }}
      >
        {edit && (
          <StationForm
            key={typeof edit === "string" ? edit : edit.id}
            station={edit === "new" ? undefined : edit}
            canDelete={stations.length > 1}
            confirmDelete={deleteId === (edit === "new" ? "" : edit.id)}
            onClose={() => {
              setEdit(null);
              setDeleteId(null);
            }}
            onSave={(s) => {
              setStations((all) =>
                edit === "new"
                  ? [...all, s]
                  : all.map((old) => (old.id === s.id ? s : old)),
              );
              setEdit(null);
              setNotice(t("Station enregistrée."));
            }}
            onDelete={() => {
              if (edit === "new") return;
              if (deleteId !== edit.id) {
                setDeleteId(edit.id);
                return;
              }
              setStations((all) => all.filter((s) => s.id !== edit.id));
              setEdit(null);
              setDeleteId(null);
            }}
          />
        )}
        {about && (
          <>
            <div className="modal-heading">
              <h2>{t("Bienvenue chez lofeur")}</h2>
              <IconButton label={t("Fermer")} onClick={() => setAbout(false)}>
                <X />
              </IconButton>
            </div>
            <div className="about-content">
              <img
                className="about-wordmark"
                src={assetUrl("logo.svg")}
                alt="lofeur"
              />
              <p>{t("Un bureau, de la musique et le temps de se poser.")}</p>
              <p>
                {t(
                  "Vos stations, favoris et réglages restent dans ce navigateur. Aucun compte, aucun suivi publicitaire.",
                )}
              </p>
              <dl>
                <div>
                  <dt>
                    <kbd>{t("Espace")}</kbd>
                  </dt>
                  <dd>{t("Lecture / pause")}</dd>
                </div>
                <div>
                  <dt>
                    <kbd>F</kbd>
                  </dt>
                  <dd>{t("Plein écran")}</dd>
                </div>
                <div>
                  <dt>
                    <kbd>H</kbd>
                  </dt>
                  <dd>{t("Masquer l’interface")}</dd>
                </div>
                <div>
                  <dt>
                    <kbd>M</kbd>
                  </dt>
                  <dd>{t("Couper le son")}</dd>
                </div>
              </dl>
              <p className="small muted">
                {t(
                  "Projet indépendant inspiré de Lofi Desk. Musique, illustrations et ambiances : Lofi Girl. Le lecteur YouTube est activé uniquement à votre demande.",
                )}
              </p>
              <a
                className="text-button"
                href="https://github.com/jean-voila/lofeur"
                target="_blank"
                rel="noreferrer"
              >
                {t("Le projet sur GitHub")}
                <ExternalLink size={15} />
              </a>
            </div>
          </>
        )}
      </dialog>
    </main>
  );
}
function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
function safeImage(url: string) {
  try {
    return new URL(url).protocol === "https:" ? url : "";
  } catch {
    return "";
  }
}
function StationForm({
  station,
  canDelete,
  confirmDelete,
  onClose,
  onSave,
  onDelete,
}: {
  station?: Station;
  canDelete: boolean;
  confirmDelete: boolean;
  onClose(): void;
  onSave(s: Station): void;
  onDelete(): void;
}) {
  const { t } = useI18n();
  const [audioUrl, setAudioUrl] = useState(station?.audioUrl || "");
  const [kind, setKind] = useState<"live" | "video">(station?.kind || "video");
  const [name, setName] = useState(station?.name || "");
  const [url, setUrl] = useState(station?.url || "");
  const [description, setDescription] = useState(station?.description || "");
  const [cover, setCover] = useState(station?.cover || "");
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const id = youtubeId(url);
        if (!name.trim()) {
          setError(t("Donnez un nom à votre station."));
          return;
        }
        if (!id) {
          setError(
            t(
              "Saisissez une URL YouTube valide (watch, live, youtu.be ou embed).",
            ),
          );
          return;
        }
        if (cover && !safeImage(cover)) {
          setError(t("L’image doit utiliser une URL HTTPS."));
          return;
        }
        if (audioUrl && !validAudioUrl(audioUrl)) {
          setError(t("Le flux audio doit utiliser une URL HTTPS."));
          return;
        }
        onSave({
          id: station?.id || crypto.randomUUID(),
          name: name.trim(),
          description: description.trim(),
          url: `https://www.youtube.com/watch?v=${id}`,
          cover: cover.trim(),
          audioUrl: audioUrl.trim(),
          kind,
        });
      }}
    >
      <div className="modal-heading">
        <h2>
          {station ? t("Modifier la station") : t("Une nouvelle fréquence")}
        </h2>
        <IconButton label={t("Fermer")} type="button" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className="form-fields">
        <label>
          {t("Nom de la station")}
          <input
            autoFocus
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Ma radio du dimanche")}
          />
        </label>
        <label>
          {t("Type de station")}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "live" | "video")}
          >
            <option value="live">{t("En direct")}</option>
            <option value="video">{t("Enregistrement")}</option>
          </select>
        </label>
        <label>
          {t("URL YouTube")}
          <input
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </label>
        <label>
          {t("Description")}
          <span className="muted">{t("(facultatif)")}</span>
          <input
            maxLength={140}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Pour les journées tranquilles")}
          />
        </label>
        <label>
          {t("Image de couverture")}
          <span className="muted">{t("(facultatif)")}</span>
          <input
            type="url"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label>
          {t("Flux audio direct")}
          <span className="muted">{t("(facultatif)")}</span>
          <input
            type="url"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://…/radio.mp3"
          />
        </label>
        <p className="small muted">
          {t(
            "Un flux MP3, AAC ou Ogg direct permet l’écoute sans vidéo. Une URL YouTube ne peut pas servir de flux audio direct.",
          )}
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="small muted">
          {t(
            "Les liens de directs et de vidéos YouTube sont acceptés. Sans image, la miniature YouTube sera utilisée.",
          )}
        </p>
      </div>
      <div className="form-footer">
        {station && (
          <button
            className="delete-button"
            disabled={!canDelete}
            type="button"
            onClick={onDelete}
            title={!canDelete ? t("Gardez au moins une station") : undefined}
          >
            <Trash2 size={16} />
            {confirmDelete ? t("Confirmer la suppression") : t("Supprimer")}
          </button>
        )}
        <button className="primary-button" type="submit">
          <Check size={17} />
          {t("Enregistrer")}
        </button>
      </div>
    </form>
  );
}
