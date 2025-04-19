import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

interface RegisterProps {
  onToggleForm?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleForm }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Register</h2>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {onToggleForm && (
        <p className="auth-switch">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onToggleForm}
            className="auth-toggle-button"
          >
            Login
          </button>
        </p>
      )}
    </div>
  );
};

export default Register;
