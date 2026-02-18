import { mailer } from "./libs.js"

export const mailVarification = async (email : string) => {

    const id = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        await mailer.sendWithTemplate({
            to: email,
            subject: "Verification Code!",
            template: "./business-layer/src/html/mail.html",
            variables: { id: id }
        });

    } catch (error) {
        console.log("Error While Sending Mail");
        return { status : "error-mail", message : "Error while sending Mail" }
    }
    return { status : "success-mail", code : id, message : "Mail Shared Successfully"}
}