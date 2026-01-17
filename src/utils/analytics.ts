import ReactGA from "react-ga4";

// 替换为你的 Google Analytics Measurement ID
// 格式如: G-XXXXXXXXXX
export const GA_MEASUREMENT_ID = "G-YR31JHB2JT";

export const initGA = () => {
  if (GA_MEASUREMENT_ID === "G-REPLACE_ME") {
    console.warn(
      "Google Analytics Measurement ID is not set. Analytics will not work."
    );
    return;
  }
  ReactGA.initialize(GA_MEASUREMENT_ID);
};

export const logPageView = () => {
  if (GA_MEASUREMENT_ID === "G-REPLACE_ME") return;
  
  ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (GA_MEASUREMENT_ID === "G-REPLACE_ME") return;

  ReactGA.event({
    category,
    action,
    label,
  });
};

// 预定义的事件类别
export const CATEGORY = {
  GAME: "Game",
  NAVIGATION: "Navigation",
  USER_ACTION: "User Action",
};

// 预定义的事件动作
export const ACTION = {
  START_GAME: "Start Game",
  WIN_GAME: "Win Game",
  LOSE_GAME: "Lose Game",
  CLICK_TUTORIAL: "Click Tutorial",
  CHANGE_SETTINGS: "Change Settings",
};
