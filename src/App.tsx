import {
  Component,
  ComponentProps,
  createEffect,
  createResource,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";
import { Civilization, getLastGame, Player as TeamPlayer } from "./query";
import { BADGES } from "./assets";

// seconds
const CONFIG = {
  SYNC_EVERY: 30,
};

const Flag: Component<ComponentProps<"img"> & { civ: Civilization }> = (props) => {
  const [local, rest] = splitProps(props, ["civ", "class"]);
  return (
    <img
      src={local.civ.flag}
      style={{ "outline-color": local.civ.color }}
      class={classes(local.class, "outline outline-1")}
      {...rest}
    />
  );
};

const Badge: Component<{ rank: string; class?: string }> = (props) => (
  <img src={BADGES[`./badges/s3/${props.rank}.svg`]} class={props.class} />
);

const Player: Component<{
  civ: Civilization;
  player: TeamPlayer;
  class?: string;
  align: "left" | "right";
  size?: "compact";
}> = (props) => {
  const rightAligned = () => props.align === "right";
  return (
    <div class={classes("flex items-center gap-3", rightAligned() && "flex-row-reverse")}>
      <Flag
        civ={props.civ}
        class={classes("rounded-sm object-cover h-5 w-9 rounded-3xl")}
      />
      {props.player?.rank && (
        <Badge
          rank={props.player.rank}
          class={classes("rounded-sm scale-[1.2] h-8")}
        />
      )}
      <div
        class={classes(
          "gap-2 justify-between flex items-center gap-4",
          rightAligned() && "text-right flex-row-reverse",
        )}
      >
        <h1
          class={classes(
            "font-bold text-md whitespace-nowrap",
            props.player.result == "loss" && "text-red-500",
            props.player.result == "win" && "text-green-500",
            props.player.profile_id == 6492127 ? "beyno-font" : ""
          )}
        >
          {props.player.profile_id == 6492127 ? "Lyra" : props.player.name}
        </h1>
        <div
          class={classes(
            "flex gap-2 text-md leading-tight",
            "opacity-80",
            rightAligned() && "justify-end"
          )}
        >
          {props.player.mode_stats ? (
            <>
              <span>#{props.player.mode_stats.rank}</span>
              <span>{props.player.mode_stats.rating}</span>
            </>
          ) : props.player.rank?.endsWith("unranked") ? (
            <span class="text-md text-white/50">Unranked</span>
          ) : (
            <span class="text-md text-white/50">No stats found</span>
          )}
        </div>
      </div>
    </div >
  );
};

let sync;
let scheduledHide;
const App: Component = () => {
  const options = new URLSearchParams(window.location.search);
  const [profileId, setProfileId] = createSignal(options.get("profileId")?.toString()?.split("-")[0]);
  if (!!profileId) { setProfileId("6492127"); }
  // rouge, vert, bleu foncé, blanc, jaune, bleu clair et violet 
  const [color, setColor] = createSignal<"rouge" | "vert" | "bleu" | "blanc" | "jaune" | "ciel" | "violet" | "noir">((options.get("color") as any) ?? "noir");
  const [dkMode, setdkMode] = createSignal(false);
  const [currentGame, { refetch }] = createResource(profileId, getLastGame);
  const [visible, setVisible] = createSignal(true);
  const game = () => (currentGame.loading ? currentGame.latest : currentGame());

  const toggle = (show: boolean) => {
    setVisible(show);
    window.clearTimeout(scheduledHide);
  };

  onMount(() => {
    sync = setInterval(() => refetch(), 1000 * CONFIG.SYNC_EVERY);
  });

  onCleanup(() => {
    clearInterval(sync);
    clearTimeout(scheduledHide);
  });

  createEffect(
    on(game, () => {
      if (game()?.today === false) toggle(false);
      else if (!visible() && game()?.ongoing) toggle(true);
    })
  );

  return (
    <div class={classes(
      "flex items-center flex-col w-[840px] mx-auto",
      dkMode() && "dark")}
      style="text-shadow: 0 0 20px black;">

      {!profileId() && (
        <div class="bg-red-900 p-6 text-sm m-4 rounded-md">
          <div class="font-bold text-white text-md mb-4">No profile selected</div>
          <span class="text-white">
            Make sure the url ends with{" "}
            <code class="text-gray-100">
              ?profileId=<span class="text-blue-300">your profile id</span>
            </code>
          </span>
        </div>
      )}
      {currentGame.error && profileId() && (
        <div class="bg-red-900 p-6 text-sm m-4 rounded-md">

          <div class="font-bold text-white text-md">Error while loading last match</div>
          <span class="text-white">{currentGame.error?.message}</span>
        </div>
      )}

      <div
        class={classes(
          "w-full duration-700 fade-in fade-out",
          "slide-in-from-top slide-out-to-top-20",
          visible() ? "animate-in" : "animate-out"
        )}
        onanimationend={(e) => {
          e.target.classList.contains("animate-out") && e.target.classList.add("hidden");
        }}//
      >
        <div
          class={classes(
            "from-black/90 via-black/70 to-black/90 bg-gradient-to-r rounded-md mt-0 w-full text-white dark:text-black inline-flex items-center relative p-1.5"
          )}
          style={themes(color())}
        >
          <div class="basis-1/2 flex flex-col gap-2">
            <For each={game()?.team}>
              {(player) => (
                <Player player={player} civ={player.civilization} align="left" size="compact" />
              )}
            </For>
          </div>
          <div class="text-center basis-36 flex flex-col self-start	gap-1 px-4 whitespace-nowrap">
            <p class="text-sm font-bold">{currentGame()?.map}</p>
          </div>
          <div class="basis-1/2 flex flex-col gap-2">
            <For each={game()?.opponents}>
              {(player) => (
                <Player player={player} civ={player.civilization} align="right" size="compact" />
              )}
            </For>
          </div>
        </div>
      </div>
      <div class="absolute top-0 left-0 p-2 bg-transparent" style="width:100px"></div>
      <div class="absolute top-0 right-0 p-2 bg-black text-white text-3xl" style="width:100px">
        <button onClick={() => { setColor("rouge"); setdkMode(false) }} style={{ "background-color": `rgba(${colorRGB["rouge"]}` }}>Rouge</button><br />
        <button onClick={() => { setColor("jaune"); setdkMode(true) }} style={{ "background-color": `rgba(${colorRGB["jaune"]}` }}>Jaune</button><br />
        <button onClick={() => { setColor("vert"); setdkMode(false) }} style={{ "background-color": `rgba(${colorRGB["vert"]}` }}>Vert</button><br />
        <button onClick={() => { setColor("blanc"); setdkMode(true) }} style={{ "background-color": `rgba(${colorRGB["blanc"]}` }} >Blanc</button><br />
        <button onClick={() => { setColor("bleu"); setdkMode(false) }} style={{ "background-color": `rgba(${colorRGB["bleu"]}` }}>Bleu</button><br />
        <button onClick={() => { setColor("ciel"); setdkMode(false) }} style={{ "background-color": `rgba(${colorRGB["ciel"]}` }}>Ciel</button><br />
        <button onClick={() => { setColor("violet"); setdkMode(false) }} style={{ "background-color": `rgba(${colorRGB["violet"]}` }}>Violet</button><br />
        <button onClick={() => { setColor("noir"); setdkMode(false) }} style={{ "background-color": `rgba(${colorRGB["noir"]}` }}>Noir</button>
        <button onClick={() => toggle(!visible())}>Show</button>
      </div>
    </div >
  );
};


const themes = (color) => (
  `
      background-image: radial-gradient(circle at bottom, 
        rgba(${colorRGB[color]},0) 0%, 
        rgba(${colorRGB[color]},0) 5%, 
        rgba(${colorRGB[color]},0.5) 25%, 
        rgba(${colorRGB[color]},0.9) 93%,
        rgba(${colorRGB[color]},0) 100%);
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      padding-left:20px;
      padding-right:20px;
    `
)

const colorRGB = {
  rouge: "110,0,0",
  jaune: "230,220,0",
  vert: "154,205,50",
  blanc: "200,200,200",
  bleu: "0,50,200",
  ciel: "100,200,250",
  violet: "160,100,220",
  noir: "0,0,0",
}
export default App;

function classes(...args: any[]) {
  return args.filter(Boolean).join(" ");
}
