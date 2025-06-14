
export const ValidModes = ['easy', 'normal', 'hard'] as const;
export type Mode = (typeof ValidModes)[number];
const blocks: Record<Mode, string[]> = {
    easy:       ['gem_blue.png', 'gem_green.png'],
    normal:     ['gem_blue.png', 'gem_green.png', 'gem_pink.png',],
    hard:       ['gem_blue.png', 'gem_green.png', 'gem_pink.png', 'gem_yellow.png'],
};

const defaultConfig = {
    rows: 5,
    columns: 5,
    tileSize: 128,
    freeMoves: false,
    duration: 60,
    cellTexture : "cell.png",
    mode: <Mode>'normal',
};

export type Config = typeof defaultConfig;

export function GetConfig(customConfig: Partial<Config> = {}): Config {
    return { ...defaultConfig, ...customConfig };
}

export function GetSymbols(mode: Mode): string[] {
    return [...blocks[mode], ...blocks.easy];
}
