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
} from "lucide-react";
import defaults from "./stations.json";
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
  type Station,
} from "./lib";
import { youtube, type Player } from "./youtube";

type TimerState = {
  phase: number;
  remaining: number;
  deadline: number | null;
  deep: boolean;
};
function useSaved<T>(key: string, initial: T, valid?: (x: unknown) => boolean) {
  const [value, setValue] = useState<T>(() => load(key, initial, valid));
  useEffect(() => save(key, value), [key, value]);
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
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/logo.svg";
      }}
    />
  );
}

export default function App() {
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
  const station = stations.find((s) => s.id === selected) || stations[0];
  const song = useNowPlaying(station);
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
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [edit, setEdit] = useState<Station | "new" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [soundActive, setSoundActive] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [reloadPlayer, setReloadPlayer] = useState(0);
  const player = useRef<Player | null>(null);
  const playerHost = useRef<HTMLDivElement>(null);
  const audios = useRef(new Map<string, HTMLAudioElement>());
  const latest = useRef({ station, volume, muted });
  latest.current = { station, volume, muted };
  const wantsPlay = useRef(false);
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
    if (!consent || !playerHost.current) return;
    let cancelled = false;
    let owned: Player | null = null;
    let readyTimeout: ReturnType<typeof setTimeout> | undefined;
    setLoading(true);
    setError("");
    setReady(false);
    const element = document.createElement("div");
    playerHost.current.replaceChildren(element);
    youtube()
      .then((YT) => {
        if (cancelled) return;
        readyTimeout = setTimeout(() => {
          if (!cancelled) {
            setLoading(false);
            setError(
              "Le lecteur ne répond pas. Réessayez ou ouvrez la station sur YouTube.",
            );
          }
        }, 20000);
        owned = new YT.Player(element, {
          videoId: youtubeId(latest.current.station.url)!,
          playerVars: {
            origin: location.origin,
            playsinline: 1,
            controls: 0,
            rel: 0,
            autoplay: 0,
          },
          events: {
            onReady: (e) => {
              clearTimeout(readyTimeout);
              if (cancelled) return;
              player.current = e.target;
              e.target.setVolume(latest.current.volume);
              if (latest.current.muted) e.target.mute();
              setReady(true);
              setLoading(false);
              if (wantsPlay.current) e.target.playVideo();
            },
            onStateChange: (e) => {
              if (cancelled) return;
              setPlaying(e.data === 1);
              setLoading(e.data === 3);
              if (e.data === 1) {
                setError("");
                setTitle(e.target.getVideoData()?.title || "");
              }
            },
            onError: (e) => {
              if (cancelled) return;
              setLoading(false);
              setPlaying(false);
              setError(
                e.data === 101 || e.data === 150
                  ? "Cette station ne permet pas la lecture intégrée. Ouvrez-la sur YouTube ou choisissez une autre station."
                  : "Cette station est indisponible. Son direct a peut-être changé : vous pouvez modifier son URL.",
              );
            },
            onAutoplayBlocked: () => {
              setLoading(false);
              setNotice("Appuyez sur lecture pour lancer la musique.");
            },
          },
        });
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      clearTimeout(readyTimeout);
      owned?.destroy();
      player.current = null;
    };
  }, [consent, reloadPlayer]);
  useEffect(() => {
    setTitle("");
    setError("");
    if (!player.current || !ready) return;
    if (wantsPlay.current)
      player.current.loadVideoById(youtubeId(station.url)!);
    else player.current.cueVideoById(youtubeId(station.url)!);
  }, [station.id, station.url, ready]);
  useEffect(() => {
    player.current?.setVolume(volume);
  }, [volume]);
  useEffect(() => {
    if (muted) player.current?.mute();
    else player.current?.unMute();
  }, [muted]);
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
        if (next.phase !== current.phase || next.complete) {
          const alarm = new Audio(
            `${reference}/sounds/pomodoro/${next.complete ? "complete" : "phase"}.mp3`,
          );
          alarm.volume = alarmVolume / 100;
          void alarm.play().catch(() => {});
          setNotice(
            next.complete
              ? "Belle session. Votre cycle est terminé !"
              : next.phase % 2 === 0
                ? "C’est l’heure de souffler. Bonne pause !"
                : "On reprend en douceur.",
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
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timer.deadline, alarmVolume, setTimer]);
  useEffect(() => {
    document.title = timer.deadline
      ? `${formatTime(timer.remaining)} · lofeur`
      : "lofeur · tune in. slow down.";
  }, [timer.remaining, timer.deadline]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);
  function togglePlay() {
    if (!consent) {
      wantsPlay.current = true;
      setConsent(true);
      return;
    }
    if (playing) {
      wantsPlay.current = false;
      player.current?.pauseVideo();
    } else {
      wantsPlay.current = true;
      if (error) setReloadPlayer((n) => n + 1);
      else player.current?.playVideo();
    }
  }
  function choose(s: Station) {
    wantsPlay.current = true;
    if (!consent) setConsent(true);
    setSelected(s.id);
    if (s.id === station.id) player.current?.playVideo();
  }
  function skip(dir: number) {
    const index = stations.findIndex((s) => s.id === station.id);
    choose(stations[(index + dir + stations.length) % stations.length]);
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
  async function toggleSound(id: string) {
    if (soundActive.includes(id)) {
      audios.current.get(id)?.pause();
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
      setNotice(
        `Impossible de lire « ${sound[1]} ». Vérifiez votre connexion puis réessayez.`,
      );
    }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice("Le plein écran n’est pas disponible dans ce navigateur.");
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
      setNotice(`${data.length} stations importées.`);
    } catch {
      setNotice(
        "Fichier invalide : utilisez un export lofeur avec 1 à 100 stations YouTube valides et des identifiants uniques.",
      );
    }
    if (importRef.current) importRef.current.value = "";
  }
  const stationList = stations
    .filter(
      (s) =>
        (!favoritesOnly || liked.includes(s.id)) &&
        `${s.name} ${s.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) => Number(liked.includes(b.id)) - Number(liked.includes(a.id)),
    );
  const soundList = [...sounds]
    .filter(
      (s) =>
        (!favoritesOnly || soundLiked.includes(s[0])) &&
        s[1].toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(soundLiked.includes(b[0])) - Number(soundLiked.includes(a[0])),
    );
  const phaseLabel =
    timer.phase % 2 === 1
      ? "Concentration"
      : timer.phase === 8
        ? "Longue pause"
        : "Petite pause";
  return (
    <main className={`desk ${zen ? "zen" : ""}`}>
      <img
        className="scene"
        src={backgrounds[theme]}
        alt="Un bureau chaleureux, une fenêtre sur la ville et un chat endormi"
      />
      <div
        className={`video-scene ${playing ? "is-playing" : ""}`}
        ref={playerHost}
        aria-label="Lecteur vidéo YouTube"
      />
      <div className="scene-shade" />
      <header className="topbar ui">
        <a className="brand" href="/" aria-label="lofeur, accueil">
          <img src="/logo.svg" alt="" />
          <span>lofeur</span>
        </a>
        <div className="top-actions">
          <IconButton
            label={fullscreen ? "Quitter le plein écran" : "Plein écran (F)"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize /> : <Maximize />}
          </IconButton>
          <IconButton
            label={theme === "dark" ? "Passer au jour" : "Passer à la nuit"}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </IconButton>
          <IconButton
            label="Masquer l’interface (H)"
            onClick={() => setZen(true)}
          >
            <EyeOff />
          </IconButton>
          <IconButton
            label="Menu"
            active={menu}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            <Menu />
          </IconButton>
        </div>
      </header>
      {menu && (
        <nav className="menu glass ui" aria-label="Réglages du bureau">
          <button
            onClick={() => {
              setPanel("stations");
              setMenu(false);
            }}
          >
            <Radio />
            Gérer mes stations
          </button>
          <button
            onClick={() => {
              setTimerVisible((v) => !v);
              setMenu(false);
            }}
          >
            <Timer />
            {timerVisible ? "Masquer" : "Afficher"} le Pomodoro
          </button>
          <button
            onClick={() => {
              setAbout(true);
              setMenu(false);
            }}
          >
            <Info />À propos & raccourcis
          </button>
          <button
            onClick={() => {
              wantsPlay.current = false;
              player.current?.pauseVideo();
              setConsent(false);
              setPlaying(false);
              setMenu(false);
              setNotice("Le lecteur YouTube a été désactivé.");
            }}
          >
            <Square />
            Désactiver YouTube
          </button>
        </nav>
      )}
      <section className="now-playing glass ui" aria-label="Station actuelle">
        <div className="now-cover">
          <Cover
            station={song?.art ? { ...station, cover: song.art } : station}
          />
        </div>
        <div className="now-copy">
          <span className="muted small">À l’écoute</span>
          <h1>{song?.artist || station.name}</h1>
          <p title={song?.title || title || station.description}>
            {song?.title || title || station.description}
          </p>
        </div>
        <Waves playing={playing} />
      </section>
      {!consent && (
        <div className="welcome-play ui">
          <button className="glass start-listening" onClick={togglePlay}>
            <Play fill="currentColor" /> Entrer dans ma bulle{" "}
            <span>Écouter avec YouTube</span>
          </button>
          <small>
            En lançant la radio, vous activez le lecteur YouTube et ses cookies.
          </small>
        </div>
      )}
      {consent && !playing && !error && (
        <button
          className="center-play glass ui"
          aria-label={loading ? "Chargement du lecteur" : "Lancer la radio"}
          disabled={loading}
          onClick={togglePlay}
        >
          {loading ? <span className="loader" /> : <Play fill="currentColor" />}
        </button>
      )}
      {error && (
        <div className="player-error glass ui" role="alert">
          <p>{error}</p>
          <div>
            <button
              className="text-button"
              onClick={() => {
                wantsPlay.current = true;
                setReloadPlayer((n) => n + 1);
              }}
            >
              Réessayer
            </button>
            <a href={station.url} target="_blank" rel="noreferrer">
              Ouvrir sur YouTube <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
      <div className="left-dock ui">
        {panel && (
          <section
            className="browser-panel glass"
            aria-label={panel === "stations" ? "Stations" : "Ambiances sonores"}
          >
            <div className="panel-header">
              <div>
                <h2>
                  {panel === "stations" ? <Radio /> : <AudioLines />}
                  {panel === "stations" ? "Stations" : "Ambiances sonores"}
                </h2>
                <p>
                  {panel === "stations"
                    ? "À chaque humeur, sa fréquence."
                    : "Composez votre petit coin de calme."}
                </p>
              </div>
              <IconButton
                label="Fermer le panneau"
                onClick={() => setPanel(null)}
              >
                <X />
              </IconButton>
            </div>
            <div className="panel-tools">
              <label className="search">
                <Search size={16} />
                <input
                  aria-label="Rechercher"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher…"
                />
              </label>
              <IconButton
                label="Afficher les favoris"
                active={favoritesOnly}
                aria-pressed={favoritesOnly}
                onClick={() => setFavoritesOnly((x) => !x)}
              >
                <Heart fill={favoritesOnly ? "currentColor" : "none"} />
              </IconButton>
              {panel === "stations" && (
                <IconButton
                  label="Ajouter une station"
                  onClick={() => setEdit("new")}
                >
                  <Plus />
                </IconButton>
              )}
            </div>
            <div className="panel-scroll">
              {panel === "stations"
                ? stationList.map((s) => (
                    <article
                      className={`station-row ${s.id === station.id ? "selected" : ""}`}
                      key={s.id}
                    >
                      <button
                        className="station-select"
                        onClick={() => choose(s)}
                        aria-label={`Écouter ${s.name}`}
                        aria-pressed={s.id === station.id}
                      >
                        <div className="station-cover">
                          <Cover station={s} />
                          {s.id === station.id && playing && <Waves playing />}
                        </div>
                        <div>
                          <h3>{s.name}</h3>
                          <p>
                            {s.description || "Votre fréquence personnelle"}
                          </p>
                        </div>
                      </button>
                      <div className="row-actions">
                        <IconButton
                          label={`Favori : ${s.name}`}
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
                          label={`Modifier ${s.name}`}
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
                        aria-label={`${soundActive.includes(s[0]) ? "Arrêter" : "Écouter"} ${s[1]}`}
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
                          <h3>{s[1]}</h3>
                          <IconButton
                            label={`Favori : ${s[1]}`}
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
                          aria-label={`Volume ${s[1]}`}
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
              {(panel === "stations"
                ? stationList.length
                : soundList.length) === 0 && (
                <p className="empty">
                  {favoritesOnly
                    ? "Ajoutez vos premiers favoris avec le cœur."
                    : "Aucun résultat. Essayez un autre mot."}
                </p>
              )}
            </div>
            {panel === "stations" ? (
              <div className="panel-footer">
                <button onClick={exportStations}>
                  <Download />
                  Exporter
                </button>
                <button onClick={() => importRef.current?.click()}>
                  <Upload />
                  Importer
                </button>
                <button
                  onClick={() => setConfirmReset((v) => !v)}
                  title="Restaurer les stations d’origine"
                >
                  <RotateCcw />
                </button>
                {confirmReset && (
                  <div className="reset-confirm">
                    <p>Remplacer vos stations par les 18 radios d’origine ?</p>
                    <button
                      onClick={() => {
                        setStations(defaults);
                        setSelected(defaults[0].id);
                        setConfirmReset(false);
                      }}
                    >
                      Restaurer
                    </button>
                    <button onClick={() => setConfirmReset(false)}>
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ambient-master">
                <Volume2 size={17} />
                <input
                  type="range"
                  aria-label="Volume général des ambiances"
                  value={master}
                  min="0"
                  max="100"
                  onChange={(e) => setMaster(+e.target.value)}
                />
                <button
                  onClick={() => {
                    for (const a of audios.current.values()) a.pause();
                    setSoundActive([]);
                  }}
                >
                  Tout arrêter
                </button>
              </div>
            )}
          </section>
        )}
        <section
          className="radio-player glass"
          aria-label="Commandes de la radio"
        >
          <div className="radio-top">
            <span className="live-dot" />
            <strong>
              {loading
                ? "Connexion…"
                : playing
                  ? "En direct"
                  : "Prêt à écouter"}
            </strong>
            <div className="radio-top-actions">
              <IconButton
                label="Station favorite"
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
                title="Ouvrir la station sur YouTube"
                aria-label="Ouvrir la station sur YouTube"
                href={station.url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink />
              </a>
            </div>
          </div>
          <div className="radio-controls">
            <IconButton label="Station précédente" onClick={() => skip(-1)}>
              <SkipBack fill="currentColor" />
            </IconButton>
            <IconButton
              label={playing ? "Mettre en pause" : "Écouter la radio"}
              disabled={loading}
              onClick={togglePlay}
            >
              {playing ? (
                <Pause fill="currentColor" />
              ) : (
                <Play fill="currentColor" />
              )}
            </IconButton>
            <IconButton label="Station suivante" onClick={() => skip(1)}>
              <SkipForward fill="currentColor" />
            </IconButton>
            <span className="control-spacer" />
            <IconButton
              label={muted ? "Rétablir le son (M)" : "Couper le son (M)"}
              onClick={() => setMuted((x) => !x)}
            >
              {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </IconButton>
            <input
              type="range"
              aria-label="Volume de la radio"
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
            Stations
          </button>
          <button
            className={`glass ${panel === "sounds" ? "active" : ""}`}
            aria-expanded={panel === "sounds"}
            onClick={() => togglePanel("sounds")}
          >
            <AudioLines />
            Ambiances
            {soundActive.length > 0 && (
              <span className="count">{soundActive.length}</span>
            )}
          </button>
        </div>
      </div>
      {timerVisible && (
        <section className="pomodoro glass ui" aria-label="Pomodoro">
          <div className="timer-header">
            <span className="timer-symbol">
              {timer.phase % 2 === 1 ? <Timer /> : <Coffee />}
            </span>
            <h2>{phaseLabel}</h2>
            <span className="phase-count">{timer.phase} / 8</span>
            <IconButton
              label="Masquer le Pomodoro"
              onClick={() => setTimerVisible(false)}
            >
              <X />
            </IconButton>
          </div>
          <div
            className="timer-display"
            role="timer"
            aria-label={`${phaseLabel} : ${formatTime(timer.remaining)}`}
          >
            {formatTime(timer.remaining)}
          </div>
          <div
            className="phase-track"
            aria-label={`Phase ${timer.phase} sur 8`}
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
                  ? "Mettre le minuteur en pause"
                  : "Démarrer le minuteur"
              }
              onClick={toggleTimer}
            >
              {timer.deadline ? (
                <Pause fill="currentColor" />
              ) : (
                <Play fill="currentColor" />
              )}
            </IconButton>
            <IconButton label="Réinitialiser cette phase" onClick={resetPhase}>
              <Square fill="currentColor" />
            </IconButton>
            <IconButton label="Recommencer le cycle" onClick={resetCycle}>
              <RotateCcw />
            </IconButton>
            <IconButton
              label="Réglages du Pomodoro"
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
                Votre rythme
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
                  <option value="focus">Classique · 25 / 5 min</option>
                  <option value="deep">Long · 50 / 10 min</option>
                </select>
                <ChevronDown size={14} />
              </label>
              <label>
                Volume de l’alarme
                <input
                  type="range"
                  aria-label="Volume de l’alarme"
                  min="0"
                  max="100"
                  value={alarmVolume}
                  onChange={(e) => setAlarmVolume(+e.target.value)}
                />
              </label>
              <p>
                4 sessions, puis une pause de {timer.deep ? 20 : 15} minutes.
              </p>
            </div>
          )}
        </section>
      )}
      <div className="right-dock ui">
        <button
          className={`glass icon-button ${timerVisible ? "active" : ""}`}
          aria-label="Afficher ou masquer le Pomodoro"
          title="Pomodoro"
          aria-pressed={timerVisible}
          onClick={() => setTimerVisible((v) => !v)}
        >
          <Timer />
        </button>
      </div>
      <button
        className="restore-ui glass icon-button"
        title="Afficher l’interface (H)"
        aria-label="Afficher l’interface"
        onClick={() => setZen(false)}
      >
        <Eye />
      </button>
      {notice && (
        <div className="toast glass" role="status">
          <Headphones size={18} />
          <p>{notice}</p>
          <IconButton
            label="Fermer la notification"
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
        aria-label="Importer des stations"
        onChange={(e) => importStations(e.target.files?.[0])}
      />
      <dialog
        ref={modalRef}
        aria-label={edit ? "Gestion des stations" : "À propos de lofeur"}
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
              setNotice("Station enregistrée.");
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
              <h2>Bienvenue chez lofeur</h2>
              <IconButton label="Fermer" onClick={() => setAbout(false)}>
                <X />
              </IconButton>
            </div>
            <div className="about-content">
              <img src="/logo.svg" alt="Logo lofeur" />
              <p>Un bureau, de la musique et le temps de se poser.</p>
              <p>
                Vos stations, favoris et réglages restent dans ce navigateur.
                Aucun compte, aucun suivi publicitaire.
              </p>
              <dl>
                <div>
                  <dt>
                    <kbd>Espace</kbd>
                  </dt>
                  <dd>Lecture / pause</dd>
                </div>
                <div>
                  <dt>
                    <kbd>F</kbd>
                  </dt>
                  <dd>Plein écran</dd>
                </div>
                <div>
                  <dt>
                    <kbd>H</kbd>
                  </dt>
                  <dd>Masquer l’interface</dd>
                </div>
                <div>
                  <dt>
                    <kbd>M</kbd>
                  </dt>
                  <dd>Couper le son</dd>
                </div>
              </dl>
              <p className="small muted">
                Projet indépendant inspiré de Lofi Desk. Musique, illustrations
                et ambiances : Lofi Girl. Le lecteur YouTube est activé
                uniquement à votre demande.
              </p>
              <a
                className="text-button"
                href="https://github.com/jean-voila/lofeur"
                target="_blank"
                rel="noreferrer"
              >
                Le projet sur GitHub <ExternalLink size={15} />
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
          setError("Donnez un nom à votre station.");
          return;
        }
        if (!id) {
          setError(
            "Saisissez une URL YouTube valide (watch, live, youtu.be ou embed).",
          );
          return;
        }
        if (cover && !safeImage(cover)) {
          setError("L’image doit utiliser une URL HTTPS.");
          return;
        }
        onSave({
          id: station?.id || crypto.randomUUID(),
          name: name.trim(),
          description: description.trim(),
          url: `https://www.youtube.com/watch?v=${id}`,
          cover: cover.trim(),
        });
      }}
    >
      <div className="modal-heading">
        <h2>{station ? "Modifier la station" : "Une nouvelle fréquence"}</h2>
        <IconButton label="Fermer" type="button" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className="form-fields">
        <label>
          Nom de la station
          <input
            autoFocus
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ma radio du dimanche"
          />
        </label>
        <label>
          URL YouTube
          <input
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </label>
        <label>
          Description <span className="muted">(facultatif)</span>
          <input
            maxLength={140}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Pour les journées tranquilles"
          />
        </label>
        <label>
          Image de couverture <span className="muted">(facultatif)</span>
          <input
            type="url"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="https://…"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="small muted">
          Les liens de directs et de vidéos YouTube sont acceptés. Sans image,
          la miniature YouTube sera utilisée.
        </p>
      </div>
      <div className="form-footer">
        {station && (
          <button
            className="delete-button"
            disabled={!canDelete}
            type="button"
            onClick={onDelete}
            title={!canDelete ? "Gardez au moins une station" : undefined}
          >
            <Trash2 size={16} />
            {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
          </button>
        )}
        <button className="primary-button" type="submit">
          <Check size={17} />
          Enregistrer
        </button>
      </div>
    </form>
  );
}
