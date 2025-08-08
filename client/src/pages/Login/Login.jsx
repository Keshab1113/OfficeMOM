import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section className="relative flex h-full min-h-screen w-full items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
      <div className="flex items-center justify-center relative z-20">
        <form
          className="bg-[linear-gradient(45deg,white,#b4d6e0)] p-6 rounded-lg shadow-md md:w-[60vh] w-[90vh]"
          onSubmit={handleLogin}
        >
          <p className="relative text-center z-20 pb-2 uppercase dark:bg-gradient-to-b dark:from-neutral-200 dark:to-neutral-500 bg-gradient-to-br from-black to-blue-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Login
          </p>
          <p className="mb-10 mt-1 text-lg text-center text-gray-700 font-bold">To access all features, you need to login first</p>
          <label htmlFor="email" className="text-lg font-bold mb-2 text-gray-700">Enter Email</label>
          <input
            type="email"
            placeholder="Enter Your Email"
            className="w-full p-2 mb-4 border outline-none rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password" className="text-lg font-bold mb-2 text-gray-700">Enter Password</label>
          <input
            type="password"
            placeholder="Enter Your Password"
            className="w-full p-2 mb-4 border outline-none rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full bg-blue-500 text-white p-2 rounded cursor-pointer">
            Login
          </button>
          <p className="mt-2 text-sm">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-blue-500 cursor-pointer"
            >
              Sign Up
            </span>
          </p>
        </form>
      </div>
    </section>
  );
};

export default Login;
