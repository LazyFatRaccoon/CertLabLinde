import UserCard from "./UserCard";

export default function UserList({ users, onSave, onDelete, locations }) {
  return (
    <div className="mt-4 w-full">
      {users.map((u) => (
        <UserCard
          key={u.id}
          user={u}
          onSave={onSave}
          onDelete={onDelete}
          locations={locations}
        />
      ))}
    </div>
  );
}
