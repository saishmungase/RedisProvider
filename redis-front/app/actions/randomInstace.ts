
const RandomInstance = async (token : string) => {

    const customInstance = await fetch("http://localhost:3000/createInstance", {
        method : "POST",
        headers: { "Content-Type": "application/json", "authorization" : token },
    })

    const data = await customInstance.json();

    return data
}

export default RandomInstance