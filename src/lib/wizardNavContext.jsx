import React from "react";

// Lets a full-screen wizard (Fuel onboarding) tell AppLayout to hide the bottom
// nav while it's mounted, so no section shows active mid-survey. The nav returns
// the moment the wizard unmounts — i.e. when the member lands on the dashboard.
export const WizardNavContext = React.createContext({ hideNav: false, setHideNav: () => {} });