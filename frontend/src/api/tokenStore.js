// const KEY = "token";

// export const getToken = () => localStorage.getItem(KEY) || "";

// export const setToken = (tok) => {
//   if (!tok) return localStorage.removeItem(KEY);
//   localStorage.setItem(KEY, tok);
// };

//export const tokenStore = {
//  get: () => localStorage.getItem("token") ?? "",
//  set: (t) => localStorage.setItem("token", t),
//  clear: () => localStorage.removeItem("token"),
//};

let accessToken = "";

export const tokenStore = {
  get: () => accessToken,
  set: (t) => (accessToken = t),
  clear: () => (accessToken = ""),
};
