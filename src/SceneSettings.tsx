import { Palette, X } from "lucide-react";
import { initialScene, type SceneOptions } from "./ProceduralScene";
import { useI18n } from "./i18n";
export default function SceneSettings({
  video,
  options,
  setOptions,
  onClose,
}: {
  video: boolean;
  options: SceneOptions;
  setOptions(value: SceneOptions): void;
  onClose(): void;
}) {
  const { t } = useI18n();
  const set = <K extends keyof SceneOptions>(key: K, value: SceneOptions[K]) =>
    setOptions({ ...options, [key]: value });
  return (
    <section
      className="scene-settings glass ui"
      aria-label={t("Apparence du fond")}
    >
      <div className="panel-header">
        <h2>
          <Palette />
          {t("Votre décor")}
        </h2>
        <button
          className="icon-button"
          aria-label={t("Fermer le panneau")}
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <div className="scene-fields">
        <p className="small muted">
          {t(
            video
              ? "La vidéo utilise davantage de mémoire et de données."
              : "Mode audio seul : aucun lecteur vidéo chargé.",
          )}
        </p>
        <fieldset disabled={video}>
          <legend>{t("Animation procédurale")}</legend>
          <label>
            {t("Style")}
            <select
              value={options.style}
              onChange={(e) => {
                const style = e.target.value as SceneOptions["style"];
                setOptions({
                  ...options,
                  style,
                  ...(style === "fireplace"
                    ? {
                        color: "#ee6827",
                        secondary: "#ffd49a",
                        background: "#130b09",
                      }
                    : {}),
                });
              }}
            >
              <option value="aurora">{t("Aurore")}</option>
              <option value="gradient">{t("Dégradé fluide")}</option>
              <option value="pixels">{t("Pixels")}</option>
              <option value="fireplace">{t("Feu de cheminée")}</option>
            </select>
          </label>
          <div className="color-fields">
            <label>
              {t("Couleur")}
              <input
                type="color"
                value={options.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </label>
            <label>
              {t("Seconde couleur")}
              <input
                type="color"
                value={options.secondary}
                onChange={(e) => set("secondary", e.target.value)}
              />
            </label>
            <label>
              {t("Fond")}
              <input
                type="color"
                value={options.background}
                onChange={(e) => set("background", e.target.value)}
              />
            </label>
          </div>
          <label>
            {t("Vitesse")}
            <output>{options.speed}%</output>
            <input
              type="range"
              min="0"
              max="100"
              aria-label={t("Vitesse")}
              value={options.speed}
              onChange={(e) => set("speed", +e.target.value)}
            />
          </label>
          <label>
            {t("Intensité du dégradé")}
            <output>{options.blend}%</output>
            <input
              type="range"
              min="0"
              max="100"
              aria-label={t("Intensité du dégradé")}
              value={options.blend}
              onChange={(e) => set("blend", +e.target.value)}
            />
          </label>
          <label>
            {t("Grain")}
            <output>{options.grain}%</output>
            <input
              type="range"
              min="0"
              max="100"
              aria-label={t("Grain")}
              value={options.grain}
              onChange={(e) => set("grain", +e.target.value)}
            />
          </label>
          {options.style === "pixels" && (
            <label>
              {t("Taille des pixels")}
              <output>{options.pixelSize}</output>
              <input
                type="range"
                min="4"
                max="48"
                step="1"
                aria-label={t("Taille des pixels")}
                value={options.pixelSize}
                onChange={(e) => set("pixelSize", +e.target.value)}
              />
            </label>
          )}
          <label>
            {t("Texture")}
            <select
              value={options.texture}
              onChange={(e) =>
                set("texture", e.target.value as SceneOptions["texture"])
              }
            >
              <option value="none">{t("Aucune")}</option>
              <option value="paper">{t("Papier")}</option>
              <option value="linen">{t("Trame textile")}</option>
            </select>
          </label>
          <label className="switch-row">
            <span>{t("Économie d’énergie")}</span>
            <input
              type="checkbox"
              role="switch"
              checked={options.eco}
              onChange={(e) => set("eco", e.target.checked)}
            />
          </label>
          <p className="small muted">
            {t(
              "Animation suspendue en arrière-plan. Vitesse à zéro pour un fond fixe.",
            )}
          </p>
          <button
            className="text-button"
            onClick={() => setOptions(initialScene)}
          >
            {t("Réinitialiser le décor")}
          </button>
        </fieldset>
      </div>
    </section>
  );
}
