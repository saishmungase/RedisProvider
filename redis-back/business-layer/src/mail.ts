import { mailer } from "./libs.js"
import { v4 } from "uuid";

export const mailVarification = async (email : string) => {

    const id = v4();
    
    try {
        await mailer.sendBasic({
            to: email,
            subject: "Verification Code!",
            text: `$Hey Your Verficiation Code is ${id}`
        });

    } catch (error) {
        console.log("Error While Sending Mail");
        return { status : "error-mail", message : "Error while sending Mail" }
    }
    return { status : "success-mail", code : id, message : "Mail Shared Successfully"}
}