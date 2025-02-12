// src/topics.ts

const API_URL = "http://localhost:5000/api/web3data";

export const getRandomTopics = async (count: number = 5): Promise<string[]> => {
    try {
        const response = await fetch("http://localhost:5000/api/web3data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: `Generate ${count} unique Web3 topics like interview questions,concepts, standards, latest news, developemnt, etc.. which should be related to blockchain and return it as a pure JSON array without any extra text` })
        });
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error fetching topics:", error);
        return [];
    }
};
