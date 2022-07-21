export type PlayersConf = {
    red: PlayerConf
    white: PlayerConf
}
export type PlayerConf = {
    name: string
}

export const defaultPlayersConf = {
    red:{name:'Red'},
    white:{name:'White'}
}