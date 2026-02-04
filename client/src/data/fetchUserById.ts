// @ts-ignore: type-only import for runtime JS
import type { User } from '../types';

export async function fetchUserById(userId: number | string): Promise<User | null> {
  try {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) return null;
    const user = await res.json();
    // Map UserStatusID to status name (1=Joining, 2=Joined, 3=Banned)
    const statusMap: Record<number, string> = { 1: 'Joining', 2: 'Joined', 3: 'Banned' };
    const userStatus = user.UserStatusID != null ? (statusMap[user.UserStatusID] || 'Joined') : 'Joined';
    // Normalize keys if needed (API may return PascalCase)
    return {
      id: user.UserID ?? user.id,
      username: user.Username ?? user.username,
      email: user.Email ?? user.email,
      imageUrl: user.ImageURL ?? user.imageUrl,
      authProvider: user.Auth_Provider ?? user.authProvider,
      characters: user.characters,
      activeCharacterId: user.activeCharacterId,
      playerInfo: user.Description ?? user.playerInfo,
      facebook: user.Facebook ?? user.facebook,
      instagram: user.Instagram ?? user.instagram,
      discord: user.Discord ?? user.discord,
      isModerator: user.Is_Moderator ?? user.isModerator,
      isAdmin: user.Is_Admin ?? user.isAdmin,
      userStatus: userStatus as 'Joining' | 'Joined' | 'Banned',
      userStatusId: user.UserStatusID ?? 2,
      isAbsent: user.Is_Absent === true || user.Is_Absent === 1 || user.isAbsent || false,
      absenceNote: user.Absence_Note ?? user.absenceNote ?? null,
    };
  } catch (e) {
    return null;
  }
}
