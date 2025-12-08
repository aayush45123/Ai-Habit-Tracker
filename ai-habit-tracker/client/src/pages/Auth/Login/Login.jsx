import { useState } from "react";
import api from "../../../utils/api";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/auth/login", form);

            if (res.status === 200) {
                localStorage.setItem("token", res.data.token);
                navigate("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                <h2>Login</h2>

                {error && <p className="error-text">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">Login</button>
                </form>

                <p>
                    Don't have an account? <Link to="/signup">Signup</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
