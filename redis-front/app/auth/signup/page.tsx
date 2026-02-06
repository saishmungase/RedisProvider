'use client'

import { reqSignup } from "@/app/actions/signup";
import { verfiedSignup } from "@/app/actions/verifiedsignup";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react"

const SignUp = () => {
    const [mail, setMail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [passCode, setPasscode] = useState("");
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const [doesSubmit, setDoesSubmit] = useState(false);
    const [reqLoad, setReqLoad] = useState(false);
    
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        if (confirmPassword && password !== confirmPassword) {
            setPasswordError("Passwords do not match");
        } else {
            setPasswordError("");
        }
    }, [password, confirmPassword]);

    async function reqMail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mail)) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        await reqSignup(mail);
    }

    async function signUp() {
        if (password !== confirmPassword) return;

        const token = await verfiedSignup(
            {
                firstName: firstName,
                lastName: lastName,
                email: mail,
                password: password,
                passcode: passCode
            }
        );

        localStorage.setItem("AuthToken", `Bearer ${token}`)
    }

    return <div className="flex justify-center items-center h-screen w-full">
        <div className="h-auto w-3/4 gap-4 rounded-lg p-2 flex items-center justify-center flex-col">
            <section className="flex justify-center">
                <h1 className="text-[1.4rem]">Lets Connect 🫱🏻‍🫲🏻</h1>
            </section>

            <section className="flex justify-center items-center flex-col w-full">

                {
                    doesSubmit &&
                    <>
                        <span className="flex flex-row w-full gap-2 m-4 justify-center">
                            <label>Firstname: </label>
                            <input
                                placeholder="John"
                                onChange={(e) => {
                                    setFirstName(e.target.value);
                                }}
                            />
                        </span>

                        <span className="flex flex-row w-full gap-2 m-4 justify-center">
                            <label>Lastname: </label>
                            <input
                                placeholder="Snow"
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                }}
                            />
                        </span>
                    </>
                }

                {/* Email Section with Validation Display */}
                {emailError && <p className="text-red-500 text-sm font-semibold">{emailError}</p>}
                <span className="flex flex-row w-full gap-2 m-4 justify-center">
                    <label>Email: </label>
                    <input
                        placeholder="johnsnow.north.king@gmail.com"
                        onChange={(e) => {
                            setMail(e.target.value);
                            if (emailError) setEmailError("");
                        }}
                    />
                </span>

                {
                    doesSubmit
                        ?
                        <>
                            <span className="flex flex-row w-full gap-2 m-4 justify-center items-center">
                                <label>Password: </label>
                                <div className="relative flex items-center">
                                    <input
                                        placeholder="Chintu"
                                        type={showPassword ? "text" : "password"}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 text-gray-600 hover:text-black"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </span>

                            {passwordError && <p className="text-red-500 text-sm font-semibold">{passwordError}</p>}
                            <span className="flex flex-row w-full gap-2 m-4 justify-center">
                                <label>Confirm Password: </label>
                                <input
                                    placeholder="Chintu"
                                    type="password"
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                    }}
                                />
                            </span>

                            <span className="flex flex-row w-full gap-2 m-4 justify-center">
                                <label>Code: </label>
                                <input
                                    placeholder="Chintu"
                                    onChange={(e) => {
                                        setPasscode(e.target.value);
                                    }}
                                />
                            </span>

                            <button
                                disabled={!!passwordError} 
                                className={`flex cursor-pointer items-center justify-center h-10 px-4 border-2 border-white text-white font-bold rounded ${!!passwordError ? 'bg-gray-500' : 'bg-black'}`}
                                onClick={async () => {
                                    await signUp()
                                    redirect("/")
                                }}
                            >
                                SignUp
                            </button>
                            <a className="text-[0.8rem] text-gray-300" href="/auth/signup">change mail?</a>
                        </>
                        :
                        <button
                            disabled={reqLoad}
                            className="cursor-pointer flex items-center justify-center h-10 px-4 bg-black border-2 border-white text-white font-bold rounded"
                            onClick={async () => {
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                if (!emailRegex.test(mail)) {
                                    setEmailError("Please enter a valid email address.");
                                    return;
                                }
                                
                                setReqLoad(true)
                                await reqMail();
                                setDoesSubmit(true);
                            }}
                        >
                            { !reqLoad ? "Request" : "....."}
                        </button>
                }
            </section>
        </div>
    </div>
}

export default SignUp;