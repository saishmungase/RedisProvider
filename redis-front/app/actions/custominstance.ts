'use server'

const api = process.env.API_URL

const CustomInstance = async (port : number, token : string) => {
    const customInstance = await fetch(`${api}/custom-instance`, {
        method : "POST",
        headers: { "Content-Type": "application/json", "authorization" : token },
        body:JSON.stringify({
            port : port
        })
    })

    const data = await customInstance.json();
    
    const status = customInstance.status;
    data['status'] = status;
    
    return data

}

export default CustomInstance