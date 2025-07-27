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
    <Card className="w-full mb-4  border ">
      <CardContent className="w-full space-y-3 py-4">
        <div className="flex w-full justify-between items-center">
          <h3 className="font-semibold text-lg">#{user.id}</h3>
          <Button size="icon" variant="ghost" onClick={() => onDelete(user.id)}>
            <Trash2 className="w-5 h-5 text-[var(--color-text-muted)]" />
          </Button>
        </div>

        <div className="flex flex-col w-full gap-4">
          <div className="flex justify-center w-full gap-2">
            <div className="space-y-2 w-full">
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
            <div className="space-y-2 w-full">
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
            <div className="space-y-2 w-full">
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
          <div className="flex justify-center gap-2 w-full">
            <div className="space-y-2 w-full">
              <label
                htmlFor={`createdAt-${user.id}`}
                className="block text-sm font-medium"
              >
                Дата реєстрації
              </label>
              {new Date(user.createdAt).toLocaleString()}
            </div>
            <div className="space-y-2 w-full">
              <label
                htmlFor={`loginCount-${user.id}`}
                className="block text-sm font-medium"
              >
                Кількість входів
              </label>

              {user.loginCount}
            </div>
            <div className="space-y-2 w-full">
              <label
                htmlFor={`lastLogin-${user.id}`}
                className="block text-sm font-medium"
              >
                Останній вхід
              </label>

              {new Date(user.lastLogin).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="w-full flex flex-wrap justify-between">
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
