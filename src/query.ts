import { FLAGS } from "./assets";

const mapPlayer =
  (leaderboard: string) =>
    (player: ApiPlayer): Player => {
      const mode: ApiMode = player.modes?.[leaderboard];
      const rank_level = mode?.rank_level ?? "unranked";
      console.log(player.name, leaderboard, mode);
      return {
        name: player.name,
        civilization: CIVILIZATIONS[player.civilization] ?? {
          name: "Unknown Civilization",
          short_name: "Unknown",
          color: "#000000",
          flag: undefined,
          key: player.civilization,
        },
        mode_stats: mode,
        rank:
          leaderboard === "rm_solo" ? `solo_${rank_level}` : leaderboard === "rm_team" ? `team_${rank_level}` : undefined,
        result: player.result,
        profile_id: player.profile_id,
      };
    };

export async function getLastGame(
  profile_id: string,
  { value, refetching }: { value: CurrentGame; refetching: boolean }
): Promise<CurrentGame> {
  try {
    const response: ApiGame = await fetch(
      `https://aoe4world.com/api/v0/players/${profile_id}/games/last?include_stats=false`
    ).then((r) => r.json());

    if (refetching && value.id == response.game_id && value.duration == response.duration) return value;

    const { map, ongoing, duration, just_finished, teams, leaderboard } = response;

    const player = teams.flat().find((p) => response.filters.profile_ids.includes(p.profile_id));
    const team = teams.find((team) => team.includes(player)) || [];
    const opponents = teams.filter((t) => t !== team).flat();
    return {
      id: response.game_id,
      team: team.map(mapPlayer(leaderboard)),
      opponents: opponents.map(mapPlayer(leaderboard)),
      player: mapPlayer(leaderboard)(player),
      kind: response.kind.replace("_", " "),
      today: isToday(response.started_at),
      duration,
      map,
      ongoing,
      recentlyFinished: just_finished,
    };
  } catch (e) {
    if (refetching) return value;
    else throw e;
  }
}

function isToday(gameTimestamp: string): boolean {
  return new Date(gameTimestamp).getTime() > new Date().getTime() - (6 * 60 * 60 * 1000);
}

export type Civilization = {
  name: string;
  short_name: string;
  flag: string;
  color: string;
  key: string;
};

const CIVILIZATIONS: Record<string, Civilization> = {
  abbasid_dynasty: {
    name: "Abbasid Dynasty",
    short_name: "Abbasid",
    color: "#3B3E41",
    flag: FLAGS.ab,
    key: "abbasid_dynasty",
  },
  delhi_sultanate: {
    name: "Delhi Sultanate",
    short_name: "Delhi",
    color: "#29A362",
    flag: FLAGS.de,
    key: "delhi_sultanate",
  },
  chinese: {
    name: "Chinese",
    short_name: "Chinese",
    color: "#DA593B",
    flag: FLAGS.ch,
    key: "chinese",
  },
  english: {
    name: "English",
    short_name: "English",
    color: "#C3D1DF",
    flag: FLAGS.en,
    key: "english",
  },
  french: {
    name: "French",
    short_name: "French",
    color: "#2CA5EA",
    flag: FLAGS.fr,
    key: "french",
  },
  holy_roman_empire: {
    name: "Holy Roman Empire",
    short_name: "HRE",
    color: "#EFDA5C",
    flag: FLAGS.hr,
    key: "holy_roman_empire",
  },
  malians: {
    name: "Malians",
    short_name: "Malians",
    color: "#D61D60",
    flag: FLAGS.ma,
    key: "malians",
  },
  mongols: {
    name: "Mongols",
    short_name: "Mongols",
    color: "#6EC9FF",
    flag: FLAGS.mo,
    key: "mongols",
  },
  ottomans: {
    name: "Ottomans",
    short_name: "Ottomans",
    color: "#2F6C4D",
    flag: FLAGS.ot,
    key: "ottomans",
  },
  rus: {
    name: "Rus",
    short_name: "Rus",
    color: "#F74C43",
    flag: FLAGS.ru,
    key: "rus",
  },
};

type Modes = "rm_solo" | "rm_team";

export type Player = {
  name: string;
  civilization: Civilization;
  mode_stats?: ApiMode;
  rank?: string;
  result?: "win" | "loss";
  profile_id: number;
};

export type CurrentGame = {
  id: number;
  duration: number;
  today: boolean;
  team: Player[];
  opponents: Player[];
  map: string;
  kind: string;
  ongoing: boolean;
  recentlyFinished: boolean;
  player: Player;
};

interface ApiGame {
  filters: {
    profile_ids: number[];
  };
  game_id: number;
  started_at: string;
  today: boolean;
  duration?: any;
  map: string;
  kind: string;
  leaderboard: string;
  server: string;
  average_rating?: any;
  ongoing: boolean;
  just_finished: boolean;
  teams: ApiPlayer[][];
}

interface ApiPlayer {
  civilization: string;
  result?: any;
  name: string;
  profile_id: number;
  steam_id: string;
  modes: Record<Modes, ApiMode>;
}

interface ApiMode {
  rating: number;
  max_rating: number;
  max_rating_7d: number;
  max_rating_1m: number;
  rank: number;
  streak: number;
  games_count: number;
  wins_count: number;
  losses_count: number;
  drops_count: number;
  last_game_at: string;
  win_rate: number;
  rank_level: string;
  rating_history: ApiRatinghistory;
}

type ApiRatinghistory = Record<string, ApiRating>;

interface ApiRating {
  rating: number;
  streak: number;
  wins_count: number;
  drops_count: number;
  games_count: number;
}

export type Theme = {
  rgb: string,
  darkMode: boolean
}
