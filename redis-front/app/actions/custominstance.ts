'use server'

const CustomInstance = async (port : number, token : string) => {
    const customInstance = await fetch("http://localhost:3000/custom-instance", {
        method : "POST",
        headers: { "Content-Type": "application/json", "authorization" : token },
        body:JSON.stringify({
            port : port
        })
    })

    const data = await customInstance.json();

    return data

}

export default CustomInstance