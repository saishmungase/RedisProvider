'use server'

const api = process.env.API_URL

export const login = async (mail : string, password : string) => {
    const res = await fetch(`${api}/login`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: mail,
            password: password
        })
    })
    const data = await res.json();
    return {
        data : data,
        status : res.status
    }
}