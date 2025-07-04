// updated UserManagement.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";

const rolesList = ["lab", "manager", "constructor", "supervisor"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [changes, setChanges] = useState({});
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    roles: [],
    signature: "",
    location: "Дніпро",
  });
  const [newSignaturePreview, setNewSignaturePreview] = useState("");
  const [signaturePreviews, setSignaturePreviews] = useState({});
  const [signatureFiles, setSignatureFiles] = useState({});
  const token = localStorage.getItem("token");

  let currentUser = null;
  if (token) {
    try {
      currentUser = JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      console.error("Невірний токен:", e);
    }
  }

  const fetchUsers = useCallback(async () => {
    const response = await axios.get("http://localhost:5000/api/users/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(response.data);
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserSignatureUpload = (id, email, file) => {
    if (!file || file.type !== "image/png") return;

    const reader = new FileReader();
    reader.onload = () => {
      setSignaturePreviews((prev) => ({ ...prev, [id]: reader.result }));
      setSignatureFiles((prev) => ({ ...prev, [id]: file }));
      setChanges((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          signature: `${email.split("@")[0]}Stamp.png`,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const saveChangesForUser = async (id) => {
    const editedData = changes[id];
    if (!editedData) return;

    const originalUser = users.find((u) => u.id === id);
    if (!originalUser) return;

    const updateData = {};
    if (editedData.name && editedData.name !== originalUser.name) {
      updateData.name = editedData.name;
    }
    if (
      editedData.roles &&
      JSON.stringify(editedData.roles) !== JSON.stringify(originalUser.roles)
    ) {
      updateData.roles = editedData.roles;
    }
    if (editedData.location && editedData.location !== originalUser.location) {
      updateData.location = editedData.location;
    }
    if (
      editedData.signature &&
      editedData.signature !== originalUser.signature
    ) {
      updateData.signature = editedData.signature;
    }

    if (signatureFiles[id]) {
      const formData = new FormData();
      formData.append("signature", signatureFiles[id]);
      formData.append("email", originalUser.email);
      await axios.post(
        "http://localhost:5000/api/signature/upload-signature",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }

    if (Object.keys(updateData).length > 0) {
      await axios.put(`http://localhost:5000/api/users/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    setChanges((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setSignatureFiles((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    fetchUsers();
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "image/png") {
      alert("Завантажте PNG файл");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNewSignaturePreview(reader.result);
    reader.readAsDataURL(file);

    const emailPrefix = newUser.email.split("@")[0];
    setNewUser((prev) => ({ ...prev, signature: `${emailPrefix}Stamp.png` }));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Користувачі</h2>
      {users.map((user) => (
        <div key={user.id} className="border p-4 mb-4 rounded">
          <div>Email: {user.email}</div>
          {signaturePreviews[user.id] ? (
            <img
              src={signaturePreviews[user.id]}
              alt="Preview"
              className="h-12"
            />
          ) : user.signature ? (
            <img
              src={`http://localhost:5000/public/${user.signature}`}
              alt="Підпис"
              className="h-12"
            />
          ) : null}
          <input
            type="file"
            accept="image/png"
            onChange={(e) =>
              handleUserSignatureUpload(user.id, user.email, e.target.files[0])
            }
          />
          <button onClick={() => saveChangesForUser(user.id)}>
            Зберегти зміни
          </button>
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          axios
            .post("http://localhost:5000/api/auth/register", newUser, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then(fetchUsers);
        }}
      >
        <input
          type="text"
          placeholder="ПІБ"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <input
          type="file"
          accept="image/png"
          onChange={handleSignatureUpload}
        />
        {newSignaturePreview && (
          <img
            src={newSignaturePreview}
            alt="Прев'ю підпису"
            className="h-12"
          />
        )}
        <button type="submit">Додати користувача</button>
      </form>
    </div>
  );
}
