import { joinClasses } from "../components/html.js";
import { desktopProfile } from "../profiles/desktop.js";
import { mobileProfessionalProfile } from "../profiles/mobile-professional.js";
import { mobileSimpleProfile } from "../profiles/mobile-simple.js";

const profiles = Object.freeze({
  "mobile-simple": mobileSimpleProfile,
  "mobile-professional": mobileProfessionalProfile,
  desktop: desktopProfile
});

export function createTemplate(profileName, { header = "", content = "", footer = "", className = "" } = {}) {
  const profile = profiles[profileName] || desktopProfile;
  return `
    <section class="${joinClasses(profile.pageClass, className)}" data-ui-template="${profile.name}" data-ui-scroll-scope="page">
      ${header}
      <div class="${profile.contentClass}" data-ui-layout="content-grid">${content}</div>
      ${footer ? `<footer class="ds-template-footer">${footer}</footer>` : ""}
    </section>
  `;
}

export function MobileSimpleTemplate(options = {}) {
  return createTemplate("mobile-simple", options);
}

export function MobileProfessionalTemplate(options = {}) {
  return createTemplate("mobile-professional", options);
}

export function DesktopManagementTemplate(options = {}) {
  return createTemplate("desktop", options);
}
