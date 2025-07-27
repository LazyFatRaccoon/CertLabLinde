import React, { useEffect, useState } from "react";
import FileUploader from "../users/FileUploader";
import { API_URL, PUBLIC_URL } from "../../constants";

export default function StampUploader() {
  const [initialUrl, setInitialUrl] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`${PUBLIC_URL}/public/stamp.png`, { method: "HEAD" }).then((r) => {
      if (r.ok) setInitialUrl(`${PUBLIC_URL}/public/stamp.png`);
    });
  }, []);

  const handleChange = async (file) => {
    if (!file) return;

    const fd = new FormData();
    fd.append("stamp", file);

    try {
      const res = await fetch(`${API_URL}/stamp/upload-stamp`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Bad response");
      await res.json();
      setInitialUrl(`${PUBLIC_URL}/public/stamp.png?t=${Date.now()}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Помилка завантаження печатки", err);
      alert("Не вдалося завантажити печатку");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold ">Печатка підприємства</h2>
      <FileUploader
        key={refreshKey}
        accept={["image/png"]}
        previewWidth={150}
        previewHeight={150}
        initialUrl={initialUrl}
        onChange={handleChange}
        removable={false}
      />
    </div>
  );
}
