"use server"

const api = process.env.API_URL

export async function checkEmail(email: string) {
  try {

    const res = await fetch(`${api}/mailCheck`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    return {
      status: res.status,
      data
    };

  } catch (err) {
    return {
      status: 500,
      data: { message: "Server error" }
    };
  }
}