/**
 * Presence Component
 *
 * Displays other users' cursors and presence on the canvas
 */

import type { UserPresence } from "@live-canvas/protocols";

interface PresenceProps {
  users: UserPresence[];
}

export function Presence({ users }: PresenceProps) {
  return (
    <>
      {users.map((user) => (
        <UserCursor key={user.id} user={user} />
      ))}
    </>
  );
}

interface UserCursorProps {
  user: UserPresence;
}

function UserCursor({ user }: UserCursorProps) {
  if (!user.cursor) return null;

  return (
    <div
      className="user-cursor"
      style={{
        left: user.cursor.x,
        top: user.cursor.y,
      }}
    >
      <svg
        className="cursor-pointer"
        viewBox="0 0 24 24"
        fill={user.color}
        style={{ transform: "rotate(-15deg)" }}
      >
        <path d="M5.65376 12.4563L11.9997 3L18.3457 12.4563H14.4997V21H9.49973V12.4563H5.65376Z" />
      </svg>
      <span
        className="cursor-label"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </span>
    </div>
  );
}

/**
 * Presence list for the toolbar/header
 */
interface PresenceListProps {
  users: UserPresence[];
  localUser: UserPresence | null;
}

export function PresenceList({ users, localUser }: PresenceListProps) {
  const allUsers = localUser ? [localUser, ...users] : users;

  return (
    <div className="presence-list">
      {allUsers.map((user, index) => (
        <div
          key={user.id}
          className="presence-avatar"
          style={{
            backgroundColor: user.color,
            marginLeft: index > 0 ? "-8px" : 0,
            zIndex: allUsers.length - index,
            border: "2px solid var(--color-bg-secondary)",
          }}
          title={`${user.name}${user.id === localUser?.id ? " (you)" : ""}`}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
