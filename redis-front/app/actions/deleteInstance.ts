"use server"

const deleteInstance = async (token : string, port : number) => {
    
    const res = await fetch(`http://localhost:3000/delete-instance`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'authorization': token || '' },
        body: JSON.stringify({ port })
    });

    const ok = res.ok;
    const data = await res.json()
    data["ok"] = ok
    return data;
}

export default deleteInstance;