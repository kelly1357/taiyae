import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Horizon';

/**
 * Maps route paths to page titles.
 * Dynamic routes (with :params) are handled separately.
 */
const routeTitles: Record<string, string> = {
  '/': SITE_NAME,
  '/regions': 'Regions',
  '/rogues': 'Rogues',
  '/ooc': 'OOC Forums',
  '/characters': 'Characters',
  '/memorial': 'Memorial',
  '/adopt': 'Adoptables',
  '/activity-tracker': 'Activity Tracker',
  '/birthdays': 'Birthdays',
  '/weather': 'Weather',
  '/plot-news': 'Plot News',
  '/sitewide-updates': 'Sitewide Updates',
  '/achievements': 'Achievements',
  '/starting-skill-points': 'Starting Skill Points',
  '/conversations': 'Messages',
  '/my-characters': 'My Characters',
  '/account': 'Account Settings',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/confirm-email': 'Confirm Email',
  // Admin
  '/admin/skill-points': 'Skill Points Approval',
  '/admin/staff-pings': 'Staff Pings',
  '/admin/user-approvals': 'User Approvals',
  '/admin/achievements': 'Achievement Requests',
  '/admin/packs': 'Pack Management',
  '/admin/homepage': 'Homepage Admin',
  '/admin/inactive-characters': 'Inactive Characters',
  // Wiki
  '/wiki/absences-and-scarcity': 'Absences & Scarcity',
  '/wiki/achievements': 'Achievements Guide',
  '/wiki/activity-checks': 'Activity Checks',
  '/wiki/faq': 'FAQ',
  '/wiki/game-overview': 'Game Overview',
  '/wiki/getting-started': 'Getting Started',
  '/wiki/handbook': 'Handbook',
  '/wiki/map': 'Map',
  '/wiki/offscreen-interactions': 'Offscreen Interactions',
  '/wiki/pack-creation': 'Pack Creation',
  '/wiki/profile-help': 'Profile Help',
  '/wiki/rules-compilation': 'Rules Compilation',
  '/wiki/rules-general': 'General Rules',
  '/wiki/rules-mind-reading': 'Mind Reading Rules',
  '/wiki/setting-overview': 'Setting Overview',
  '/wiki/skill-points': 'Skill Points',
  '/wiki/spirit-symbols': 'Spirit Symbols',
  '/wiki/spirit-symbol-quiz': 'Spirit Symbol Quiz',
  '/wiki/three-strike-rule': 'Three Strike Rule',
  '/wiki/title-list': 'Title List',
  '/wiki/using-tags': 'Using Tags',
  '/wiki/wolf-guide': 'Wolf Guide',
  '/wiki/wolf-guide-fighting': 'Wolf Guide — Fighting',
  '/wiki/wolf-guide-pup-development': 'Wolf Guide — Pup Development',
};

/**
 * Sets the document title based on the current route.
 * For static routes, uses the mapping above.
 * For dynamic routes, falls back to a generic title based on the path prefix.
 */
export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = routeTitles[pathname];

    if (title) {
      document.title = title === SITE_NAME ? SITE_NAME : `${title} — ${SITE_NAME}`;
    } else {
      // Handle dynamic routes by prefix
      if (pathname.startsWith('/region/')) {
        // Title will be set by Region component once data loads
      } else if (pathname.startsWith('/subarea/')) {
        // Title will be set by Subarea component once data loads
      } else if (pathname.startsWith('/pack/')) {
        // Title will be set by PackPage component once data loads
      } else if (pathname.startsWith('/character/')) {
        // Title will be set by CharacterProfile once data loads
      } else if (pathname.startsWith('/thread/')) {
        // Title will be set by ThreadView once data loads
      } else if (pathname.startsWith('/ooc-forum/')) {
        // Title will be set by OOCForum once data loads
      } else if (pathname.startsWith('/wiki/user/')) {
        // Title will be set by UserWikiPage once data loads
      } else {
        document.title = SITE_NAME;
      }
    }
  }, [pathname]);
}

/**
 * Sets a specific page title. Use this in dynamic pages
 * after data has loaded (e.g., character name, thread subject).
 */
export function useCustomPageTitle(title: string | undefined | null) {
  useEffect(() => {
    if (title) {
      document.title = `${title} — ${SITE_NAME}`;
    }
  }, [title]);
}
