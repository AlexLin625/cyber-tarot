import React, { useState } from "react";
import "../assets/flip-card.css";
import { useTarotDB } from "../tarot-db";

const renderFlippableCard: React.FC<{
    name: string;
}> = (props) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <div
            onClick={() => setFlipped(true)}
            className="py-3 px-5"
        >
            <div className="card">
                <div
                    className={`card-inner ${
                        flipped ? "flipped" : ""
                    }`}
                >
                    <div className="card-front">
                        <img src="/img/back.jpg" />
                    </div>
                    <div className="card-back">
                        <img
                            src={`/img/${props.name}.webp`}
                        />
                    </div>
                </div>
            </div>

            <p
                className={`card-text ${
                    flipped ? " flipped" : ""
                }`}
            >
                {useTarotDB()[props.name].name}
            </p>
        </div>
    );
};

let selected: string[] = [];

export const TarotSpread: React.FC = () => {
    const renderCards = () => {
        if (selected.length === 0) {
            const deck = Object.keys(useTarotDB());
            const shuffled = deck.sort(
                () => 0.5 - Math.random()
            );
            selected = shuffled.slice(0, 3);
        }

        return selected.map((name) =>
            renderFlippableCard({ name })
        );
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-row justify-center items-center">
                {renderCards()}
            </div>
        </div>
    );
};
