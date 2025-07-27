import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import FileUploader from "./FileUploader";

import { rolesList } from "../../constants";

export default function UserCreator({ onCreate, locations = [] }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    roles: [],
    locationId: "",
    signature: "",
  });
  const [file, setFile] = useState(null);
  const [uploaderKey, setUploaderKey] = useState(0);

  const valid = form.email && form.roles.length;

  const toggleRole = (role) => {
    setForm((f) => {
      const has = f.roles.includes(role);
      return {
        ...f,
        roles: has ? f.roles.filter((r) => r !== role) : [...f.roles, role],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return alert("Email та хоча б одна роль обов'язкові");
    try {
      await onCreate(form, file);
      setForm({
        name: "",
        email: "",
        roles: [],
        locationId: "",
        signature: "",
      });
      setFile(null);
      setUploaderKey((k) => k + 1);
    } catch (err) {
      console.error("create error", err);
      alert(err.response?.data?.message || "Помилка створення користувача");
    }
  };

  return (
    <Card className="mt-2 ">
      <CardContent className="space-y-4 py-6">
        <h3 className="text-xl font-semibold">Створити користувача</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label htmlFor="newName" className="w-full">
              <Input
                id="newName"
                name="newName"
                placeholder="ПІБ"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="off"
              />
            </label>
            <label htmlFor="newEmail" className="w-full">
              <Input
                id="newEmail"
                name="newEmail"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="off"
              />
            </label>
            <label htmlFor="newLocation" className="w-full">
              <Select
                id="newLocation"
                name="newLocation"
                value={String(form.locationId)}
                onValueChange={(val) =>
                  setForm({ ...form, locationId: Number(val) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Локація" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <div className="w-full flex flex-wrap justify-between">
            <div className="space-y-1">
              <div className="font-medium">Ролі</div>
              <div className="flex gap-4 flex-wrap">
                {rolesList.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-1"
                    htmlFor={`newRole-${role}`}
                  >
                    <Checkbox
                      id={`newRole-${role}`}
                      name="newRole"
                      checked={form.roles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-medium">Підпис</div>
              <FileUploader
                key={uploaderKey}
                accept={["image/png"]}
                initialUrl=""
                onChange={(f) => {
                  setFile(f);
                  if (f) {
                    const emailPrefix = form.email.split("@")[0];
                    setForm({ ...form, signature: `${emailPrefix}Stamp.png` });
                  } else {
                    setForm({ ...form, signature: "" });
                  }
                }}
              />
            </div>
          </div>
          <Button type="submit" disabled={!valid}>
            Створити
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
