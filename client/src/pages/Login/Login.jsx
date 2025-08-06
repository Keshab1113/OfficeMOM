import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleLogin}>
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        <input type="email" placeholder="Email" className="w-full p-2 mb-4 border" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full p-2 mb-4 border" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-blue-500 text-white p-2 rounded">Login</button>
        <p className="mt-2 text-sm">Don't have an account? <span onClick={() => navigate("/signup")} className="text-blue-500 cursor-pointer">Sign Up</span></p>
      </form>
    </div>
  );
};

export default Login;