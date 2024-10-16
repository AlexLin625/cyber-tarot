import { useTarotDB } from "./tarot-db";

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

export const qwenSummary = async (
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

export const qwenDetailed = async (
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
