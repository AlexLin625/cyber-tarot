import React, { useState } from "react";
import Markdown from "react-markdown";

import { useTarotDB } from "../tarot-db";
import { renderTarot } from "./all-tarot-list";
import { qwenDetailed, qwenSummary } from "../qwen";

import "../assets/flip-card.css";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { flipCard } from "../store/spreadState";
import {
    setQuestion,
    appendAnswer,
    resetAnswer,
    setUserQueryState,
} from "../store/queryState";

interface TarotState {
    name: string;
    orientation: "upright" | "reversed";
}

const renderFlippableCard: React.FC<{
    state: TarotState;
    index: number;
}> = (props) => {
    const spreadState = useSelector(
        (state: RootState) => state.spread
    );
    const dispatch = useDispatch();
    const flipped = spreadState.flipped[props.index];

    const handleClick = () => {
        if (flipped) return;
        dispatch(flipCard(props.index));

        console.log(spreadState.flippedCount);
        if (spreadState.flippedCount === 2)
            dispatch(setUserQueryState("ready"));
    };

    return (
        <div onClick={handleClick} className="py-3 px-5">
            <div className="card">
                <div
                    className={`card-inner ${
                        flipped ? "flipped" : ""
                    }`}
                >
                    <div className="card-front">
                        <img src="/img/back.jpg" />
                    </div>
                    <div
                        className={`card-back ${props.state.orientation}`}
                    >
                        <img
                            src={`/img/${props.state.name}.webp`}
                        />
                    </div>
                </div>
            </div>

            <p
                className={`card-text ${
                    flipped ? " flipped" : ""
                }`}
            >
                {useTarotDB()[props.state.name].name +
                    (props.state.orientation === "reversed"
                        ? " (逆位)"
                        : "")}
            </p>
        </div>
    );
};

let selected: TarotState[] = [];

export const TarotSpread: React.FC = () => {
    const spreadState = useSelector(
        (state: RootState) => state.spread
    );
    const queryState = useSelector(
        (state: RootState) => state.query
    );
    const dispatch = useDispatch();

    const renderCards = () => {
        return spreadState.selectedTarots.map(
            (state, index) =>
                renderFlippableCard({ state, index })
        );
    };

    const handleAnalysis = async () => {
        if (queryState.userQueryState !== "ready") return;

        dispatch(setUserQueryState("pending"));
        const data = await qwenSummary(
            selected,
            queryState.question
        );
        const summary = data.choices[0].message.content;
        dispatch(resetAnswer());
        dispatch(appendAnswer(summary));

        for (let index = 0; index < 3; index++) {
            let res = await qwenDetailed(
                selected,
                index,
                summary,
                queryState.question
            );

            dispatch(
                appendAnswer(
                    "\n\n" + res.choices[0].message.content
                )
            );
        }

        dispatch(setUserQueryState("done"));
    };

    const renderResult = () => {
        if (queryState.userQueryState === "idle")
            return null;

        return (
            <div className="flex flex-col items-center justify-center text-foreground py-8 w-[768px]">
                {queryState.answer ? (
                    <>
                        <h3 className="text-3xl font-bold self-start py-4">
                            千问占卜
                        </h3>
                        <Markdown className="description">
                            {queryState.answer}
                        </Markdown>
                        {queryState.userQueryState ===
                            "pending" && (
                            <p className="w-full text-center text-2xl py-2">
                                千问占卜中...
                            </p>
                        )}
                        <h3 className="text-3xl font-bold self-start py-4">
                            关于你抽到的塔罗牌
                        </h3>
                        {selected.map((state) =>
                            renderTarot(
                                state.name,
                                useTarotDB()[state.name]
                            )
                        )}
                    </>
                ) : (
                    ""
                )}
                {queryState.userQueryState === "pending" &&
                    !queryState.answer && (
                        <p className="w-full text-center text-2xl py-2">
                            千问占卜中...
                        </p>
                    )}
            </div>
        );
    };

    const renderAnalysis = () => {
        if (queryState.userQueryState === "idle")
            return null;
        return (
            <div className="flex flex-col items-center w-full">
                <div className="input-container w-[768px] pt-8">
                    <p>你想要占卜的问题</p>
                    <input
                        type="text"
                        value={queryState.question}
                        onInput={(e) => {
                            const target =
                                e.target as HTMLInputElement;
                            dispatch(
                                setQuestion(target.value)
                            );
                        }}
                    />
                </div>
                <button
                    className="py-2 px-4 rounded-full text-foreground bg-blue-600 my-3"
                    onClick={handleAnalysis}
                >
                    大师我悟了!
                </button>
                {renderResult()}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-row justify-center items-center">
                {renderCards()}
            </div>
            {renderAnalysis()}
        </div>
    );
};
