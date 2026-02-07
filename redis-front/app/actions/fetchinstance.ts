'use server'

const fetchInstance = async (port: number, token: string) => {
    try {
        const response = await fetch(`http://localhost:3000/get-instance?port=${port}`, {
            method: 'GET',
            headers: { 
                "Content-Type": "application/json", 
                "authorization" : token 
            }
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Server Action Error:", error);
        return null;
    }
}

export default fetchInstance;