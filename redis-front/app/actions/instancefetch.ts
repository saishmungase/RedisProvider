'use server'


const api = process.env.API_URL

export const liveFetch = async () => {
    const response = await fetch(`${api}/used-instances`, {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    
    const status = response.status;
    data['status'] = status;

    return data.instance || [];
}