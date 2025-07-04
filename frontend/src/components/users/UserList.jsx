import UserCard from "./UserCard";

export default function UserList({ users, onSave, onDelete }) {
  return (
    <div className="mt-4">
      {users.map((u) => (
        <UserCard key={u.id} user={u} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}
