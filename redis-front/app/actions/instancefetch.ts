'use server'

export const liveFetch = async () => {
    const response = await fetch('http://localhost:3000/used-instances', {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    return data.instance || [];
}