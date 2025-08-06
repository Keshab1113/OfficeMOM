import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/signup", { email, password });
      navigate("/login");
    } catch (err) {
      alert("Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleSignup}>
        <h2 className="text-2xl font-semibold mb-4">Sign Up</h2>
        <input type="email" placeholder="Email" className="w-full p-2 mb-4 border" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full p-2 mb-4 border" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-green-500 text-white p-2 rounded">Sign Up</button>
        <p className="mt-2 text-sm">Already have an account? <span onClick={() => navigate("/login")} className="text-blue-500 cursor-pointer">Login</span></p>
      </form>
    </div>
  );
};

export default Signup;