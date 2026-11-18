// The login token is kept in sessionStorage (cleared when the tab closes)
const TOKEN_KEY = 'tiko_token'
const ROLE_KEY = 'tiko_role'

export const getToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token)
export const getRole = () => sessionStorage.getItem(ROLE_KEY)
export const setRole = (role) => sessionStorage.setItem(ROLE_KEY, role)
export const clearToken = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ROLE_KEY)
}
