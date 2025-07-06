import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../constants";

const availableRoles = ["lab", "constructor", "supervisor", "manager"];

export default function RegisterUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState([]);
  const [signature, setSignature] = useState(null);
  const [stamp, setStamp] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toggleRole = (role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("roles", JSON.stringify(roles));
      if (signature) formData.append("signature", signature);
      if (stamp) formData.append("stamp", stamp);

      const res = await axios.post(`${API_URL}/register`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(res.data.message);
      setError("");
      setName("");
      setEmail("");
      setRoles([]);
      setSignature(null);
      setStamp(null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Не вдалося зареєструвати користувача"
      );
      setMessage("");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Додати користувача</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ім'я користувача"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <div className="mb-2">
          <p className="font-medium mb-1">Ролі:</p>
          {availableRoles.map((role) => (
            <label key={role} className="block">
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
                className="mr-2"
              />
              {role}
            </label>
          ))}
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-medium">Підпис користувача:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSignature(e.target.files[0])}
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-medium">
            Печатка підприємства:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setStamp(e.target.files[0])}
          />
        </div>
        {message && <p className="text-green-600 mb-2">{message}</p>}
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Зареєструвати
        </button>
      </form>
    </div>
  );
}
