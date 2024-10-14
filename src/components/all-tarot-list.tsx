import Markdown from "react-markdown";
import { useTarotDB, Tarot } from "../tarot-db";

export const AllTarotList: React.FC = () => {
    return (
        <div className="flex flex-col items-center w-full h-full">
            {Object.entries(useTarotDB()).map(
                ([name, tarot]) => {
                    return renderTarot(name, tarot);
                }
            )}
        </div>
    );
};

function wordCloud(keywords: string[]) {
    return (
        <div className="text-white font-thin flex-row flex-wrap w-full p-8">
            {keywords.map((word) => {
                const size =
                    Math.max(12, 36 * (1.2 / word.length)) *
                    (Math.random() * 0.2 + 1);

                return (
                    <span
                        style={{ fontSize: `${size}px` }}
                        className="pr-3 py-2"
                    >
                        {word}
                    </span>
                );
            })}
        </div>
    );
}

export function renderTarot(name: string, tarot: Tarot) {
    return (
        <div className="flex flex-row max-w-[768px] items-start py-8">
            <div className="flex flex-col items-start justify-start w-72 shrink-0">
                <img
                    className="block w-72 object-contain pr-6"
                    src={`/img/${name}.webp`}
                />

                <h3 className="text-3xl font-bold py-4">
                    {tarot.name}
                </h3>
                <p className="font-thin text-foreground text-sm">
                    {name}
                </p>
            </div>
            <div className="text-foreground flex flex-col">
                <h4 className="text-2xl font-bold py-4 text-white">
                    正位
                </h4>
                {wordCloud(tarot.upright.keywords)}
                <Markdown className="description font-sans">
                    {tarot.upright.full}
                </Markdown>
                <h4 className="text-2xl font-bold py-4 text-white">
                    逆位
                </h4>
                {wordCloud(tarot.reversed.keywords)}
                <Markdown className="description font-sans">
                    {tarot.reversed.full}
                </Markdown>
            </div>
        </div>
    );
}
