'use server'

export const verfiedSignup = async (reqBody :  {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    passcode: string
}) => {
    const res = await fetch("http://localhost:3000/verified-signup", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reqBody)
    })
    const data = await res.json();
    const token = data.token;
    return token;
}