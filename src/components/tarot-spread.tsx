import React from "react";
import Markdown from "react-markdown";

import { useTarotDB } from "../tarot-db";
import { renderTarot } from "./all-tarot-list";
import { qwenDetailed, qwenSummary } from "../qwen";

import "../assets/flip-card.css";
import "../assets/loading.css";
import "../assets/index.css";

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

const FlippableCard: React.FC<{
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
    };

    return (
        <div onClick={handleClick} className="py-3 px-5">
            <div className="card shadow-lg hover:shadow-xl duration-300">
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

export const TarotSpread: React.FC = () => {
    const spreadState = useSelector(
        (state: RootState) => state.spread
    );
    const queryState = useSelector(
        (state: RootState) => state.query
    );
    const dispatch = useDispatch();

    const renderCards = () => {
        return (
            <div className="flex flex-row items-center justify-center py-8 w-[100vw] bg-black/20">
                {spreadState.selectedTarots.map(
                    (state, index) => (
                        <FlippableCard
                            state={state}
                            index={index}
                            key={index}
                        />
                    )
                )}
            </div>
        );
    };

    const handleAnalysis = async () => {
        if (queryState.question === "") return;
        dispatch(setUserQueryState("anwser-generation"));

        const data = await qwenSummary(
            spreadState.selectedTarots,
            queryState.question
        );
        const summary = data.choices[0].message.content;
        dispatch(resetAnswer());
        dispatch(appendAnswer(summary));

        for (let index = 0; index < 3; index++) {
            let res = await qwenDetailed(
                spreadState.selectedTarots,
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

    const texts = [
        "数据占星师正在解析你的命运矩阵...",
        "正在连接未来预言数据库...",
        "命运节点同步中，准备接收你的塔罗讯息...",
        "Transformer塔罗大师正在微调你的命运轨迹...",
        "正在通过量子网络计算未来变量...",
        "命运女神的服务器正在响应，请稍候...",
        "塔罗集群正在加载命运算法模块...",
        "命运因子握手中...",
        "正在用纳米纤维布擦水晶球...",
        "正在和命运女神结算API费用...",
    ];

    let prevIndex = 0;
    const randomText = () => {
        let index;
        do {
            index = Math.floor(
                Math.random() * texts.length
            );
        } while (index === prevIndex);
        prevIndex = index;
        return texts[index];
    };
    const [text, setText] = React.useState(randomText());

    const randomLoadingText = () => {
        return (
            <p
                className="w-full text-center text-2xl py-2 loading-text"
                onAnimationIteration={() => {
                    console.log("animation iteration");
                    setText(randomText());
                }}
            >
                {text}
            </p>
        );
    };

    const renderResult = () => {
        return (
            <div className="flex flex-col items-center justify-center text-foreground py-8 w-[768px]">
                <p className="text-2xl font-thin w-full pt-8 text-foreground text-right pb-8">
                    <span className="font-bold pr-4">
                        问题
                    </span>
                    {queryState.question}
                </p>
                {queryState.answer ? (
                    <>
                        <h3 className="text-3xl font-bold self-start py-4">
                            千问占卜
                        </h3>
                        <Markdown className="description fade-in-container">
                            {queryState.answer}
                        </Markdown>
                        <p className="font-thin text-sm italic w-full text-center py-4">
                            内容由大模型生成, 仅供娱乐
                        </p>
                    </>
                ) : (
                    ""
                )}

                {queryState.userQueryState !== "done" &&
                    randomLoadingText()}

                {queryState.userQueryState === "done" && (
                    <>
                        <h3 className="text-3xl font-bold self-start py-4">
                            关于你抽到的塔罗牌
                        </h3>
                        {spreadState.selectedTarots.map(
                            (state) =>
                                renderTarot(
                                    state.name,
                                    useTarotDB()[state.name]
                                )
                        )}
                    </>
                )}
            </div>
        );
    };

    const switchToTarotSpread = () => {
        if (queryState.question === "") return;
        dispatch(setUserQueryState("tarot-spread-page"));
    };

    const recommendedQuestions = [
        "我目前的职业道路是否适合我?",
        "我最近的恋爱运怎么样?",
        "目前的选择会如何影响我的未来?",
    ];

    const renderRecommendedQuestions = () => {
        return (
            <div className="flex flex-row flex-wrap max-w-xl py-3">
                {recommendedQuestions.map(
                    (question, index) => (
                        <button
                            key={index}
                            className="recommend-bubble mr-3"
                            onClick={() => {
                                dispatch(
                                    setQuestion(question)
                                );
                            }}
                        >
                            {question}
                        </button>
                    )
                )}
            </div>
        );
    };

    const renderQuestionInput = () => {
        return (
            <>
                <div className="input-container pt-8 pb-24">
                    <p className="text-4xl font-bold px-0 w-full">
                        旅者
                    </p>
                    <p className="text-3xl font-thin pt-2 pb-8 px-0 w-full">
                        想要了解什么?
                    </p>
                    <div className="flex flex-row items-center justify-center input-container w-full">
                        <input
                            type="text"
                            value={queryState.question}
                            placeholder="向塔罗牌提问"
                            onInput={(e) => {
                                const target =
                                    e.target as HTMLInputElement;
                                dispatch(
                                    setQuestion(
                                        target.value
                                    )
                                );
                            }}
                        />
                        <button
                            className="py-2 px-4 ml-4 rounded-full text-foreground bg-zinc-900 my-3 text-nowrap"
                            onClick={() => {
                                switchToTarotSpread();
                            }}
                        >
                            大师我悟了!
                        </button>
                    </div>
                    {renderRecommendedQuestions()}
                </div>
            </>
        );
    };

    switch (queryState.userQueryState) {
        case "init-page":
            return (
                <div className="flex flex-col items-center justify-center h-full w-full">
                    {renderQuestionInput()}
                </div>
            );
        case "tarot-spread-page":
            return (
                <div className="flex flex-col items-center fade-in">
                    {renderCards()}
                    {spreadState.flippedCount === 3 && (
                        <button
                            className="py-3 px-6 ml-4 rounded-full text-foreground  bg-zinc-900 my-8 text-nowrap fade-in"
                            onClick={handleAnalysis}
                        >
                            开始解读
                        </button>
                    )}
                </div>
            );
        case "anwser-generation":
        case "done":
            return (
                <div className="flex flex-col items-center justify-center">
                    {renderCards()}
                    {renderResult()}
                </div>
            );
    }
};
