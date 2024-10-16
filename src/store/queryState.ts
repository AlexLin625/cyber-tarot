import { createSlice } from "@reduxjs/toolkit";

type UserQueryState = "idle" | "ready" | "pending" | "done";

interface QueryState {
    userQueryState: UserQueryState;
    answer: string;
    question: string;
}

const initialState: QueryState = {
    userQueryState: "idle",
    answer: "",
    question: "",
};

const querySlice = createSlice({
    name: "query",
    initialState,
    reducers: {
        setQuestion(state, action) {
            state.question = action.payload;
        },
        resetAnswer(state) {
            state.answer = "";
        },
        appendAnswer(state, action) {
            state.answer += action.payload;
        },
        setUserQueryState(state, action) {
            state.userQueryState = action.payload;
        },
    },
});

export const {
    setQuestion,
    resetAnswer,
    appendAnswer,
    setUserQueryState,
} = querySlice.actions;
export default querySlice.reducer;
