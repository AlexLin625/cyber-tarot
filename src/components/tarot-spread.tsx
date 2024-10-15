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

export const summarySystemPrompt = `
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
- 输出相对简短的回答，不需要过多的细节。

`;

export const detailedSystemPrompt = `
# 角色与能力

你是一个专业的塔罗牌解读师。你擅长结合牌阵的含义，向用户提供详细的解读。

# 输入

首先，是关于卡牌的信息，包括卡牌的名字和正反位。随后，是用户的问题。

紧接着，是关于这张卡牌的详细信息。

# 任务和要求

 - 你需要结合总体情况和卡牌的参考解读，给出关于这张卡牌的详细解读。
 - 你的回复应当以介绍卡牌本身开头，你不需要重复总结的内容。
 - 你的回答需要聚焦于当前卡牌的详细解读。
 - 不要在你的回复中过多提及其他卡牌。
 - 你的输出应当整理成一个完整而流畅的段落，不需要展示你的推理过程。
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

const queryQwen = async (messages: any) => {
    const baseUrl =
        "https://qwen-forward-2.linhongjie625.workers.dev";

    const headers = {
        "Content-Type": "application/json",
    };

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

const generateCardSummary = (
    tarots: TarotState[],
    question: string
) => {
    let userMessage =
        tarots
            .map(
                (tarot, index) =>
                    `
         - 第 ${index + 1} 张牌是 ${
                        tarot.name
                    }，它的朝向是 ${
                        tarot.orientation
                    }。这张牌含义的关键词包括 ${useTarotDB()[
                        tarot.name
                    ][tarot.orientation].keywords.join(
                        ","
                    )}。
            `
            )
            .join("\n") + "\n";

    return `
    ## 抽卡结果
    ${userMessage}

    ## 用户问题
    <|question|> ${question} <|question|>
`;
};

const qwenSummary = async (
    tarots: TarotState[],
    question: string
) => {
    const messages = [
        {
            role: "system",
            content: summarySystemPrompt,
        },
        {
            role: "user",
            content: `
            ${generateCardSummary(tarots, question)}
            
            ## 输出要求
            请根据用户的问题，选择一种范式进行解读，并给出一个总体的解释。
            `,
        },
    ];
    const data = await queryQwen(messages);
    return data;
};

const qwenDetailed = async (
    tarots: TarotState[],
    index: number,
    summary: string,
    question: string
) => {
    const currentName = tarots[index].name;
    const messages = [
        {
            role: "system",
            content: detailedSystemPrompt,
        },
        {
            role: "user",
            content: `
            ${generateCardSummary(tarots, question)}

            ## 卡片${
                useTarotDB()[currentName].name
            }的详细解读
            ${
                useTarotDB()[currentName][
                    tarots[index].orientation
                ].full
            }

            ## 总体解读
            ${summary}
            
            ## 任务
            你需要根据${
                useTarotDB()[currentName].name
            }卡的参考解读，结合用户的问题和上面的情况总结，给出与用户情况相结合的详细解读。你的回答应当以
            \`\`\`
            ${useTarotDB()[currentName].name}卡的_位代表...
            \`\`\`
            的简单介绍开头
            `,
        },
    ];

    const data = await queryQwen(messages);
    return data;
};

const renderFlippableCard: React.FC<{
    state: TarotState;
}> = (props) => {
    const [flipped, setFlipped] = useState(false);

    const handleClick = () => {
        if (flipped) return;
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
    const [queryedAnalysis, setQueryedAnalysis] =
        useState(false);
    const [analysis, setAnalysis] = useState("");
    const [done, setDone] = useState(false);

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
        const data = await qwenSummary(selected, question);
        const summary = data.choices[0].message.content;

        setAnalysis(summary);
        for (let index = 0; index < 3; index++) {
            let res = await qwenDetailed(
                selected,
                index,
                summary,
                question
            );

            setAnalysis((prevAnalysis) =>
                prevAnalysis.concat(
                    [
                        "\n\n",
                        res.choices[0].message.content,
                    ].join("")
                )
            );
        }
        setDone(true);
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
                        {!done && (
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
                {!done && (
                    <p className="w-full text-center text-2xl py-2">
                        千问占卜中...
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
