import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../api/axiosInstance";
import UserList from "./UserList";
import UserCreator from "./UserCreator";

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const fetchUsers = useCallback(async () => {
    const { data } = await api.get("/users/");
    setUsers(data);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ------------------ CRUD helpers ------------------ */
  // const addChangeLog = async (action, details) => {
  //   try {
  //     await api.post("/logs/users", { action, ...details });
  //   } catch (e) {
  //     console.error("log error", e);
  //   }
  // };

  const handleCreate = async (form, file) => {
    // upload signature if provided
    try {
      if (file) {
        const fd = new FormData();
        fd.append("email", form.email);
        fd.append("signature", file);

        await api.post("/signature/upload-signature", fd);
      }
      const { data } = await api.post("/auth/register", form);
      console.log("REGISTER RESPONSE", data);
      //const newId = data.user?.id || data.id; // fallback
      //await addChangeLog("create", { userId: newId });
      fetchUsers();

      alert("Користувача успішно створено ✅");
    } catch (e) {
      const msg = e.response?.data?.message || "Помилка створення користувача";
      alert(msg); // ← показуємо причину (наприклад, Email already in use)
      console.error("register error", e);
    }
  };

  const handleSave = async (id, draft, file) => {
    const original = users.find((u) => u.id === id);
    if (!original) return;
    const diff = {};
    ["name", "roles", "location", "signature"].forEach((k) => {
      if (JSON.stringify(draft[k]) !== JSON.stringify(original[k]))
        diff[k] = draft[k];
    });
    // upload new signature
    if (file) {
      const fd = new FormData();
      fd.append("email", original.email);
      fd.append("signature", file);

      console.log("📤 uploading", file.name, file.type, original.email);
      await api.post("/signature/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    if (Object.keys(diff).length) {
      await api.put(`/users/${id}`, diff);
      //await addChangeLog("update", { userId: id, diff });
      fetchUsers();
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/users/${id}`);
    //await addChangeLog("delete", { userId: id });
    fetchUsers();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Користувачі</h2>
      <UserList users={users} onSave={handleSave} onDelete={handleDelete} />
      <UserCreator onCreate={handleCreate} />
    </div>
  );
}
