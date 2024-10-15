import { useEffect, useState } from "react";
import { AllTarotList } from "./components/all-tarot-list";
import { TarotSpread } from "./components/tarot-spread";
import { loadTarotDB } from "./tarot-db";
import { About } from "./components/about";

export const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState("spread");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        loadTarotDB().then(() => {
            setIsReady(true);
        });
    });

    const navs = [
        {
            name: "spread",
            label: "塔罗牌阵",
        },
        {
            name: "tarot",
            label: "所有塔罗牌",
        },
        {
            name: "about",
            label: "关于",
        },
    ];

    const renderNavButton = (name: string) => {
        const isActive = activeTab === name;

        return (
            <button
                className={
                    "nav-button" +
                    (isActive ? " active" : "")
                }
                onClick={() => setActiveTab(name)}
            >
                {
                    navs.find((nav) => nav.name === name)
                        ?.label
                }
            </button>
        );
    };

    const renderBody = () => {
        if (!isReady) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <p className="text-4xl font-thin text-white">
                        Loading...
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case "spread":
                return <TarotSpread />;
            case "tarot":
                return <AllTarotList />;
            case "about":
                return <About />;
        }
    };

    return (
        <>
            <div className="flex flex-col w-full">
                <nav className="flex flex-row justify-center items-center bg-background p-4 w-full">
                    <h1 className="text-2xl text-white pr-16">
                        赛博塔罗
                    </h1>
                    {navs.map((nav) => {
                        return renderNavButton(nav.name);
                    })}
                </nav>
                {renderBody()}
            </div>
        </>
    );
};

export default App;
