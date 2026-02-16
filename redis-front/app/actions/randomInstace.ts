'use server'

const api = process.env.API_URL

const RandomInstance = async (token : string) => {

    const randomInstance = await fetch(`${api}/createInstance`, {
        method : "POST",
        headers: { "Content-Type": "application/json", "authorization" : token },
    })

    const data = await randomInstance.json();
    
    const status = randomInstance.status;
    data['status'] = status;

    return data
}

export default RandomInstance