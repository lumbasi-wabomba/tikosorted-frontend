// The login token is kept in sessionStorage (cleared when the tab closes)
const TOKEN_KEY = 'tiko_token'

export const getToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)
