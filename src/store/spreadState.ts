import { createSlice } from "@reduxjs/toolkit";
import { useTarotDB } from "../tarot-db";

interface TarotState {
    name: string;
    orientation: "upright" | "reversed";
}

interface SpreadState {
    isInitialized: boolean;
    selectedTarots: TarotState[];
    flipped: boolean[];
    flippedCount: number;
}

const initState: SpreadState = {
    isInitialized: false,
    selectedTarots: [],
    flipped: Array<boolean>(3).fill(false),
    flippedCount: 0,
};

const spreadState = createSlice({
    name: "spread",
    initialState: initState,
    reducers: {
        shuffleTarots(state) {
            let selected: TarotState[] = [];
            const cards = Object.keys(useTarotDB());
            const shuffled = cards.sort(
                () => Math.random() - 0.5
            );

            shuffled.slice(0, 3).forEach((name) => {
                const epsilon = Math.random();
                let orientation: "upright" | "reversed";
                if (epsilon < 0.3) orientation = "reversed";
                else orientation = "upright";
                selected.push({
                    name,
                    orientation,
                });
            });

            state.selectedTarots = selected;
            state.isInitialized = true;
        },
        flipCard(state, action) {
            state.flipped[action.payload] = true;
            state.flippedCount++;
        },
    },
});

export const { shuffleTarots, flipCard } =
    spreadState.actions;
export default spreadState.reducer;
