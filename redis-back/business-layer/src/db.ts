import { redis } from "./utils.js"

export const validateCode = async ({code, email} : {code : string, email : string}) => {
    try {
        const actualCode = await redis.hget("auth", email);
        return actualCode == code;
    } catch (error) {
        console.log("Error While Fetching Code:- " + error)
    }
    return false;
}