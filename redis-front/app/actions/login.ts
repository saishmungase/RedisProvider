'use server'

export const login = async (mail : string, password : string) => {
    const res = await fetch("http://localhost:3000/login", {
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