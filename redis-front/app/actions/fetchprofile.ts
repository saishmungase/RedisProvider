'use server'

const api = process.env.API_URL

const fetchUser = async (token : string) => {
    const response = await fetch(`${api}/get-profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "authorization" : token 
        }
    });

    const data = await response.json();
    
    const status = response.status;
    data['status'] = status;

    return data
}

export default fetchUser