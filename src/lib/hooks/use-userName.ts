import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

export const useUserName = () => {
    const [username, setUsername] = useState<string>("");
    const ANIMAL = ['monkey', 'wolf', 'doge', "doncky", "hen", "hock"];
    const STORAGE_KEY = "chat_username";
    const generateUserName = () => {
        const word = ANIMAL[Math.floor(Math.random() * ANIMAL.length)];
        return `anonymous-${word}-${nanoid(5)}`
    }
    useEffect(() => {
        const main = () => {
            const storedUserName = localStorage.getItem(STORAGE_KEY);

            if (storedUserName) {
                setUsername(storedUserName);
                return;
            }
            const generated = generateUserName();
            localStorage.setItem(STORAGE_KEY, generated)
            setUsername(generated);
        }
        main();
    }, []);

    return { username }

}