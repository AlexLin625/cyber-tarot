import { configureStore } from "@reduxjs/toolkit";
import spreadReducer from "./spreadState";
import queryReducer from "./queryState";

const store = configureStore({
    reducer: {
        spread: spreadReducer,
        query: queryReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { store };
