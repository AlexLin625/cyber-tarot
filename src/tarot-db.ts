export interface TarotSide {
    keywords: string[];
    full: string;
}

export interface Tarot {
    name: string;
    upright: TarotSide;
    reversed: TarotSide;
}

let tarotDB: Record<string, Tarot> = {};

export const loadTarotDB = async () => {
    if (Object.keys(tarotDB).length === 0) {
        await fetch("/tarot_database_cn.json")
            .then((response) => response.json())
            .then((data) => {
                tarotDB = data;
            });
    }
};

export const useTarotDB = (): Record<string, Tarot> => {
    return tarotDB;
};
