'use server'

const fetchUser = async (token : string) => {
    const response = await fetch('http://localhost:3000/get-profile', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "authorization" : token 
        }
    });

    const data = await response.json();

    return data
}

export default fetchUser