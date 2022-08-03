import {defaultNames} from 'tsgammon-core/records/utils/defaultNames'

export type PlayersConf = {
    red: PlayerConf
    white: PlayerConf
}

export type PlayerConf = {
    name: string
}

export const defaultPlayersConf = {
    red:{name:defaultNames.red},
    white:{name:defaultNames.white}
}