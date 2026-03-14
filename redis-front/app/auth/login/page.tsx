'use client'

import { login } from "@/app/actions/login";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkEmail } from "@/app/actions/checkEmail";

const Login = () => {

    const router = useRouter();

    const [mail, setMail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [reqLoad, setReqLoad] = useState(false);
    const [emailError, setEmailError] = useState("");

    const [emailExists, setEmailExists] = useState<boolean | null>(null);
    const [checkingMail, setCheckingMail] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    async function signIn() {

        if (!emailRegex.test(mail)) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        setReqLoad(true);

        try {

            const { data, status } = await login(mail, password);

            if (status === 200) {

                localStorage.setItem("AuthToken", `Bearer ${data.token}`);
                router.push("/");

            } else {

                alert(data.description || data.message);
                setReqLoad(false);
            }
        } catch (error) {
            console.error("Login failed", error);
            setReqLoad(false);
        }
    }

    useEffect(() => {

        if (!emailRegex.test(mail)) {
            setEmailExists(null);
            return;
        }

        const timer = setTimeout(async () => {

            setCheckingMail(true);

            const { status, data } = await checkEmail(mail);

            if (status === 200) {

                if (data.available) {

                    setEmailExists(false);
                    setEmailError("Email not registered. Please signup.");

                } else {

                    setEmailExists(true);
                    setEmailError("");

                }

            }

            setCheckingMail(false);

        }, 1000);

        return () => clearTimeout(timer);

    }, [mail]);

    return (
        <div className="flex justify-center items-center h-screen w-full">

            <div className="h-auto w-3/4 gap-4 rounded-lg p-2 flex items-center justify-center flex-col">

                <section className="flex justify-center">
                    <h1 className="text-[1.4rem]">Welcome Back 👋🏻</h1>
                </section>

                <section className="flex justify-center items-center flex-col w-full">

                    {emailError && (
                        <p className="text-red-500 text-sm font-semibold">
                            {emailError}
                        </p>
                    )}

                    {checkingMail && (
                        <p className="text-gray-400 text-sm">
                            Checking email...
                        </p>
                    )}

                    <span className="flex flex-row w-full gap-2 m-4 justify-center">
                        <label>Email: </label>

                        <input
                            placeholder="johnsnow.north.king@gmail.com"
                            onChange={(e) => {

                                setMail(e.target.value);
                                setEmailError("");
                                setEmailExists(null);

                            }}
                        />

                    </span>

                    <span className="flex flex-row w-full gap-2 m-4 justify-center items-center">

                        <label>Password: </label>

                        <div className="relative flex items-center">

                            <input
                                disabled={emailExists === false}
                                placeholder="Chintu"
                                type={showPassword ? "text" : "password"}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") signIn();
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 text-gray-600 hover:text-black"
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>

                        </div>

                    </span>

                    <button
                        disabled={reqLoad || emailExists === false}
                        className="cursor-pointer flex items-center justify-center h-10 px-4 bg-black border-2 border-white text-white font-bold rounded"
                        onClick={signIn}
                    >
                        {!reqLoad ? "Login" : "....."}
                    </button>

                    <a
                        className="text-[0.8rem] text-gray-300"
                        href="/auth/signup"
                    >
                        create an account?
                    </a>

                </section>

            </div>

        </div>
    );
};

export default Login;