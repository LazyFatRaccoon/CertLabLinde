import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../constants";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, {
        email,
      });
      setMessage(res.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send password");
      setMessage("");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Відновлення пароля</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Ваша електронна пошта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
            required
          />
        </label>
        {message && (
          <p className="text-green-600 mb-2">
            Тимчасовий пароль висланий на електронну адресу
          </p>
        )}
        {error && <p className="text-red-500 mb-2">Щось пішло не так</p>}
        <button
          type="submit"
          className="w-full bg-[var(--color-bg)] hover:bg-[var(--color-hover)] text-[var(--color-text)] p-2 rounded"
        >
          Надіслати пароль
        </button>
      </form>
    </div>
  );
}
