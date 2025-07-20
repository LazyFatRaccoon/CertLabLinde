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

import { rolesList } from "../../constants";

export default function UserCard({ user, onSave, onDelete, locations = [] }) {
  const [draft, setDraft] = useState({ ...user });
  const [file, setFile] = useState(null);

  const dirty = () => {
    const keys = ["name", "roles", "locationId", "signature"];
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
            <label
              htmlFor={`name-${user.id}`}
              className="block text-sm font-medium"
            >
              ПІБ
            </label>
            <Input
              id={`name-${user.id}`}
              name="name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`email-${user.id}`}
              className="block text-sm font-medium"
            >
              Email
            </label>
            <Input
              id={`email-${user.id}`}
              name="email"
              value={user.email}
              autoComplete="off"
              disabled
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`createdAt-${user.id}`}
              className="block text-sm font-medium"
            >
              Дата реєстрації
            </label>
            <Input
              id={`createdAt-${user.id}`}
              name="createdAt"
              value={new Date(user.createdAt).toLocaleString()}
              disabled
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`loginCount-${user.id}`}
              className="block text-sm font-medium"
            >
              Кількість входів
            </label>

            <Input
              id={`loginCount-${user.id}`}
              name="loginCount"
              value={user.loginCount}
              disabled
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`lastLogin-${user.id}`}
              className="block text-sm font-medium"
            >
              Останній вхід
            </label>
            <Input
              id={`lastLogin-${user.id}`}
              name="lastLogin"
              value={new Date(user.lastLogin).toLocaleString()}
              disabled
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`location-${user.id}`}
              className="block text-sm font-medium"
            >
              Локація
            </label>
            <Select
              value={String(draft.locationId)}
              id={`location-${user.id}`}
              name="location"
              onValueChange={(val) =>
                setDraft({ ...draft, locationId: Number(val) })
              }
              autoComplete="off"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Оберіть локацію" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name}
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
              <label
                key={role}
                className="flex items-center gap-1"
                htmlFor={`${user.id}-role-${role}`}
              >
                <Checkbox
                  id={`${user.id}-role-${role}`}
                  name="roles"
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
                ? `${
                    process.env.REACT_APP_API_URL?.replace(/\/api$/, "") || ""
                  }/public/${user.signature}`
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
