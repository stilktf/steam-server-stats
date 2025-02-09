import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import open from "open";

@action({ UUID: "tf.stilk.steam-server-stats.track-server" })
export class TrackServer extends SingletonAction<TrackServerSettings> {
  async getStuff(ev: WillAppearEvent<TrackServerSettings>) {
    const { settings } = ev.payload;

    // Set text telling user that the key is updating
    const svgLoading = `<svg width="100" height="100">
            <text x="5" y="60" class="loading" fill="green" stroke="white" stroke-width="2" font-size="20">Refreshing</text>
        </svg>`;

    await ev.action.setImage(
      `data:image/svg+xml,${encodeURIComponent(svgLoading)}`,
    );

    const response = await fetch(
      `https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${settings.steamApiKey}&filter=addr\\${settings.serverAddress}`,
    );
    streamDeck.logger.info(response.ok);
    if (!response.ok) {
      streamDeck.logger.error(`steam API returned error.`);
      const svg = `<svg width="100" height="100">
                <style>
                    .error {
                        fill: red;
                    }
                </style>
                <text x="20" y="50" class="error" fill="red" stroke="white" stroke-width="2" font-size="20">Error</text>
            </svg>`;
      return ev.action.setImage(
        `data:image/svg+xml,${encodeURIComponent(svg)}`,
      );
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();

    if (!data["response"]["servers"][0]) {
      streamDeck.logger.info("server offline?");
      const svg = `<svg width="100" height="100" style="background-color: #136699">
                <style>
                    .warning {
                        fill: orange;
                    }
                </style>
                <text x="20" y="50" fill="orange" stroke="white" stroke-width="2" font-size="20" class="warning">Offline</text>
            </svg>`;
      return ev.action.setImage(
        `data:image/svg+xml,${encodeURIComponent(svg)}`,
      );
    }

    const playersOnline: string = data["response"]["servers"][0]["players"];
    const maxPlayers: string = data["response"]["servers"][0]["max_players"];

    const svg = `<svg width="100" height="100" style="background-color: #136699">
            <style>
                .ok {
                    fill: green
                }
            </style>
            <text x="20" y="50" class="ok" stroke="white" stroke-width="2" font-size="20">Online</text>
            <text x="20" y="80" stroke="white" stroke-width="2" fill="blue" font-size="20">${playersOnline}/${maxPlayers}</text>
        </svg>`;
    return ev.action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
  }
  override async onWillAppear(
    ev: WillAppearEvent<TrackServerSettings>,
  ): Promise<void> {
    const { settings } = ev.payload;

    streamDeck.logger.info(
      `Settings: URL: ${settings.serverAddress}, API: ${settings.steamApiKey}`,
    );

    ev.action.setTitle("Server"); // Don't like it? Change the title in the settings.
    this.getStuff(ev);

    setInterval(() => {
      this.getStuff(ev);
    }, 300000);
  }

  override async onKeyDown(
    ev: KeyDownEvent<TrackServerSettings>,
  ): Promise<void> {
    const { settings } = ev.payload;
    try {
      open(`steam://connect/${settings.serverAddress}`);
      ev.action.showOk();
    } catch (e) {
      streamDeck.logger.error(
        `Error occured while trying to open Steam URL!\n${e}`,
      );
      ev.action.showAlert();
    }
  }
}

/**
 * Settings for {@link TrackServer}.
 */
type TrackServerSettings = {
  serverAddress?: string;
  steamApiKey?: string;
};