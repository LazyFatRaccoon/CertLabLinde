import React, { useState, useEffect } from "react";
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
import { Trash2 } from "lucide-react";
import FileUploader from "./FileUploader";

import { rolesList, locations } from "../../constants";

export default function UserCard({ user, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...user });
  const [file, setFile] = useState(null);

  const dirty = () => {
    const keys = ["name", "roles", "location", "signature"];
    return (
      keys.some((k) => JSON.stringify(draft[k]) !== JSON.stringify(user[k])) ||
      !!file
    );
  };

  useEffect(() => {
    setDraft({ ...user });
    setFile(null);
  }, [user]);

  const toggleRole = (role) => {
    setDraft((d) => {
      const has = d.roles.includes(role);
      return {
        ...d,
        roles: has ? d.roles.filter((r) => r !== role) : [...d.roles, role],
      };
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="space-y-3 py-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">#{user.id}</h3>
          <Button size="icon" variant="ghost" onClick={() => onDelete(user.id)}>
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">ПІБ</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Email</label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Дата реєстрації</label>
            <Input value={new Date(user.createdAt).toLocaleString()} disabled />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Кількість входів
            </label>
            <Input value={user.loginCount} disabled />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Останній вхід</label>
            <Input value={new Date(user.lastLogin).toLocaleString()} disabled />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Локація</label>
            <Select
              value={draft.location}
              onValueChange={(val) => setDraft({ ...draft, location: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Оберіть локацію" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-1">
          <div className="font-medium">Ролі</div>
          <div className="flex gap-4 flex-wrap">
            {rolesList.map((role) => (
              <label key={role} className="flex items-center gap-1">
                <Checkbox
                  checked={draft.roles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>
        </div>

        {/* Signature */}
        <div className="space-y-1">
          <div className="font-medium">Підпис</div>
          <FileUploader
            accept={["image/png"]}
            initialUrl={
              user.signature
                ? `http://localhost:5000/public/${user.signature}`
                : ""
            }
            onChange={(f) => {
              setFile(f);
              if (f) {
                const emailPrefix = user.email.split("@")[0];
                setDraft({ ...draft, signature: `${emailPrefix}Stamp.png` });
              } else {
                setDraft({ ...draft, signature: "" });
              }
            }}
          />
        </div>

        {dirty() && (
          <Button
            onClick={async () => {
              await onSave(user.id, draft, file);
              setFile(null);
            }}
          >
            Зберегти зміни
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
