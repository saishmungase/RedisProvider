'use server'

export const reqSignup = async (mail : string) => {
    const res = await fetch("http://localhost:3000/signup", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: mail
        })
    })
    console.log(res)
}