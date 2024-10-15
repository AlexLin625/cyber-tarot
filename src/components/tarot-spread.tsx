import React, { useState } from "react";
import "../assets/flip-card.css";
import { useTarotDB } from "../tarot-db";
import Markdown from "react-markdown";
import { renderTarot } from "./all-tarot-list";

let flipCounter: number;
let setFlipCounter: React.Dispatch<
    React.SetStateAction<number>
>;

interface TarotState {
    name: string;
    orientation: "upright" | "reversed";
}

export const systemPrompt = `
# 角色与能力

你是一个专业的塔罗牌解读师。你的任务是根据用户提供的三张牌的Spread, 解读三张牌的含义，并根据这三张牌的含义，给出一个总体的解读。

# 输入

输入分为几个部分，首先，是三张牌的名字和正反位。随后，每张牌代表的示例解读会出现在其后面，以 <|tarot|> 或类似的符号包围起来。

输入的第二部分是用户的问题。以 <|question|> 开头，后面跟着用户的问题。

# 任务

1. 根据用户的问题，选择使用以下两种范式的其中之一进行三张牌的解读，分别是

a. 过去 - 现在 - 未来
b. 问题 - 解决方案 - 结果

2. 将三张牌放入你选择的范式。结合用户的背景，整理出流畅的文字。

# 要求

- 对于每一个阶段的回答，你应该：
 - 首先结合你的思考内容，简要解释这张牌在当前位置的含义。
 - 然后，给出一些可能性的推理。
- 你的输出应当整理成一个完整而流畅的段落，不需要展示你的推理过程。
- 不要向用户明确展示以上的范式。

`;

export const cardTemplate = (
    state: TarotState,
    index: number
) => {
    return `
    ### 第${index + 1}张牌
    
    这张牌是, ${
        useTarotDB()[state.name].name
    }. 其主要代表关键词是${useTarotDB()[state.name][
        state.orientation
    ].keywords.join(",")}. \n\n你可以参考以下的解释文本:\n\n
    <|tarot|>\n${
        useTarotDB()[state.name][state.orientation].full
    }\n<|tarot|>.\n\n
    `;
};

const queryQwen = async (
    tarots: TarotState[],
    question: string,
) => {
    const baseUrl =
        "https://qwen-forward-2.linhongjie625.workers.dev";

    const headers = {
        "Content-Type": "application/json",
    };

    let userMessage = "";
    for (let i = 0; i < tarots.length; i++) {
        userMessage += cardTemplate(tarots[i], i);
    }

    const messages = [
        {
            role: "system",
            content: systemPrompt,
        },
        {
            role: "user",
            content:
                userMessage +
                "\n\n## 用户提出的问题是\n" +
                question,
        },
    ];

    const body = {
        messages: messages,
    };
    const response = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    const data = await response.json();
    return data;
};

const renderFlippableCard: React.FC<{
    state: TarotState;
}> = (props) => {
    const [flipped, setFlipped] = useState(false);

    const handleClick = () => {
        setFlipped(true);
        setFlipCounter(flipCounter + 1);
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
    [flipCounter, setFlipCounter] = useState(0);

    const [question, setQuestion] = useState("");
    // const [secret, setSecret] = useState("");

    const [queryedAnalysis, setQueryedAnalysis] =
        useState(false);
    const [analysis, setAnalysis] = useState("");

    const renderCards = () => {
        if (selected.length === 0) {
            const deck = Object.keys(useTarotDB());
            const shuffled = deck.sort(
                () => 0.5 - Math.random()
            );
            shuffled.slice(0, 3).forEach((name) => {
                const epsilon = Math.random();
                let orientation: "upright" | "reversed";
                if (epsilon < 0.3) orientation = "reversed";
                else orientation = "upright";
                selected.push({ name, orientation });
            });
        }

        return selected.map((state) =>
            renderFlippableCard({ state })
        );
    };

    const handleAnalysis = async () => {
        if (queryedAnalysis) return;
        
        setQueryedAnalysis(true);
        const data = await queryQwen(
            selected,
            question,
        );
        
        setAnalysis(data.choices[0].message.content);
        console.log(data);
    };

    const renderResult = () => {
        if (!queryedAnalysis) return null;
        return (
            <div className="flex flex-col items-center justify-center text-foreground py-8 w-[768px]">
                {analysis ? (
                    <>
                        <h3 className="text-3xl font-bold self-start py-4">
                            千问占卜
                        </h3>
                        <Markdown className="description">
                            {analysis}
                        </Markdown>
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
                    <p className="text-2xl font-thin">
                        千问生成中...
                    </p>
                )}
            </div>
        );
    };

    const renderAnalysis = () => {
        if (flipCounter < 3) return null;
        return (
            <div className="flex flex-col items-center w-full">
                <div className="input-container w-[768px] pt-8">
                    {/* <p>
                        你的DashScope Secret
                        (用于调用通义千问)
                    </p>
                    <input
                        type="text"
                        value={secret}
                        onInput={(e) => {
                            const target =
                                e.target as HTMLInputElement;
                            setSecret(target.value);
                        }}
                    /> */}

                    <p>你想要占卜的问题</p>
                    <input
                        type="text"
                        value={question}
                        onInput={(e) => {
                            const target =
                                e.target as HTMLInputElement;
                            setQuestion(target.value);
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
