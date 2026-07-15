export const designTokens = Object.freeze({
  color: Object.freeze({
    primary: "var(--accent-primary)",
    surface: "var(--card-bg)",
    text: "var(--text-primary)",
    muted: "var(--text-secondary)",
    border: "var(--border-primary)"
  }),
  spacing: Object.freeze({
    xs: "var(--space-xs)",
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)"
  }),
  breakpoint: Object.freeze({
    mobile: 480,
    mobileLarge: 640,
    tablet: 768,
    tabletLarge: 1024,
    desktop: 1280,
    desktopLarge: 1440
  }),
  layout: Object.freeze({
    pageMaxWidth: "var(--page-max-width)",
    formMaxWidth: "var(--form-max-width)",
    headerHeight: "var(--app-header-height)",
    sidebarWidth: "var(--desktop-sidebar-width)",
    bottomNavigationHeight: "var(--mobile-bottom-nav-height)",
    scrollOwner: "#app-content",
    pageWidth: "min(100%, var(--page-max-width))",
    contentMinWidth: 0
  }),
  control: Object.freeze({
    compact: "var(--control-height-sm)",
    standard: "var(--control-height-md)",
    large: "var(--control-height-lg)"
  }),
  radius: Object.freeze({
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)"
  }),
  shadow: Object.freeze({
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)"
  })
});
