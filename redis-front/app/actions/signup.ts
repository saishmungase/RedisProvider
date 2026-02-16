'use server'

const api = process.env.API_URL

export const reqSignup = async (mail : string) => {
    const res = await fetch(`${api}/signup`, {
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