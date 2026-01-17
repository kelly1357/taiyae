// @ts-ignore: type-only import for runtime JS
import type { User } from '../types';

export async function fetchUserById(userId: number | string): Promise<User | null> {
  try {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) return null;
    const user = await res.json();
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
    };
  } catch (e) {
    return null;
  }
}
