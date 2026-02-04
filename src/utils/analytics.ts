import ReactGA from "react-ga4";

// 替换为你的 Google Analytics Measurement ID
// 格式如: G-XXXXXXXXXX
export const GA_MEASUREMENT_ID = "G-YR31JHB2JT";

export const initGA = () => {
  ReactGA.initialize(GA_MEASUREMENT_ID);
};

export const logPageView = () => {
  
  ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
};

export const logEvent = (category: string, action: string, label?: string) => {

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
