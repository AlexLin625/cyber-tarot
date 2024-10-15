import Markdown from "react-markdown";

export const About = () => {
    return (
        <div className="w-full flex flex-col items-center">
            <Markdown className="description max-w-lg">
                {`

### 如何使用?

原则上，你应该沐浴更衣, 点起药草香, 集中注意力, 并在抽卡之前在你的脑中对你的问题维持一个清晰的认知。当然了，作为一个使用先进电子设备的现代人，你大概率不信这些。

### How it works?

本站会从22张大阿卡纳中随机抽选3张，并随机分配抽选的正逆位。当你输入问题并提交分析时，网页会将设计好的提示词，塔罗牌的解释文字和你的问题拼接在一起，让大模型进行看图说话。处于成本考虑，模型选用的是具有长窗口的\`qwen-long\`.

`}
            </Markdown>
        </div>
    );
};
