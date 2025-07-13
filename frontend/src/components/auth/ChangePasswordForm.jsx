import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../constants";

export default function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/auth/change-password`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(res.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Не вдалося змінити пароль");
      setMessage("");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Зміна пароля</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="oldPassword">
          <input
            id="oldPassword"
            name="oldPassword"
            type="password"
            placeholder="Старий пароль"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
            autoComplete="new-password"
            required
          />
        </label>
        <label htmlFor="newPassword">
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Новий пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
            autoComplete="new-password"
            required
          />
        </label>
        {message && <p className="text-green-600 mb-2">{message}</p>}
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Змінити пароль
        </button>
      </form>
    </div>
  );
}
