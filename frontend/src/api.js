const config = {
  demoMode: import.meta.env.VITE_DEMO_MODE !== 'false',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
  cognitoDomain: (import.meta.env.VITE_COGNITO_DOMAIN || '').replace(/\/$/, ''),
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || window.location.origin + '/',
  logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI || window.location.origin + '/',
}

export const appConfig = config

const demoEmployees = {
  '1001': {
    employeeId: '1001',
    name: 'Alice Chen',
    salary: 92000,
    dateOfJoin: '2024-01-15',
    description: 'Cloud Engineering employee',
  },
  '1002': {
    employeeId: '1002',
    name: 'Marcus Williams',
    salary: 108500,
    dateOfJoin: '2023-08-21',
    description: 'Platform Reliability employee',
  },
  '1003': {
    employeeId: '1003',
    name: 'Priya Raman',
    salary: 101250,
    dateOfJoin: '2022-11-07',
    description: 'Data Products employee',
  },
  '1005': {
    employeeId: '1005',
    name: 'Sanjana Shankar',
    salary: 95000,
    dateOfJoin: '2026-01-15',
    description: 'arn:aws:iam::934747883187:user/hr-assignment-admin',
  },
}

export async function lookupEmployee(employeeId, idToken) {
  const normalizedId = String(employeeId).trim()

  if (config.demoMode) {
    await new Promise((resolve) => setTimeout(resolve, 550))
  
    const employee = demoEmployees[normalizedId]
  
    if (!employee) {
      const error = new Error('Employee not found')
      error.status = 404
      throw error
    }
  
    return employee
  }
  
  if (!config.apiBaseUrl) {
    throw new Error(
      'VITE_API_BASE_URL is missing. Configure the API URL and restart Vite.'
    )
  }

  const response = await fetch(`${config.apiBaseUrl}/employee/${encodeURIComponent(normalizedId)}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  })

  let payload = {}
  try {
    payload = await response.json()
  } catch {
    payload = {}
  }

  if (!response.ok) {
    const error = new Error(payload.message || `Request failed with status ${response.status}`)
    error.status = response.status
    throw error
  }

  return payload
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => String.fromCharCode(33 + (byte % 94))).join('')
}

export async function startLogin() {
  if (config.demoMode) {
    sessionStorage.setItem('atlas_demo_authenticated', 'true')
    window.location.reload()
    return
  }

  if (!config.cognitoDomain || !config.clientId) {
    throw new Error(
      'Cognito is not configured. Check VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID, then restart Vite.'
    )
  }

  const verifier = randomString()
  const challenge = base64UrlEncode(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  sessionStorage.setItem('atlas_pkce_verifier', verifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`${config.cognitoDomain}/oauth2/authorize?${params.toString()}`)
}

export async function completeLogin() {
  const code = new URLSearchParams(window.location.search).get('code')
  if (!code) return null

  if (config.demoMode) {
    sessionStorage.setItem('atlas_demo_authenticated', 'true')
    window.history.replaceState({}, document.title, window.location.pathname)
    return 'demo-token'
  }
  
  if (!config.cognitoDomain || !config.clientId) {
    throw new Error(
      'Cognito is not configured. Check VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID, then restart Vite.'
    )
  }

  const verifier = sessionStorage.getItem('atlas_pkce_verifier')
  if (!verifier) throw new Error('The login session expired. Please try again.')

  const response = await fetch(`${config.cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: verifier,
    }),
  })

  {/*if (!response.ok) throw new Error('Unable to complete login.')
  const tokens = await response.json()*/}
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error('Cognito token exchange failed:', {
      status: response.status,
      error: payload.error,
      description: payload.error_description,
    })

    throw new Error(
      payload.error_description ||
      payload.error ||
      `Cognito token exchange failed with status ${response.status}`
    )
  }

  const tokens = payload

  sessionStorage.setItem('atlas_id_token', tokens.id_token)
  sessionStorage.setItem('atlas_access_token', tokens.access_token)
  sessionStorage.removeItem('atlas_pkce_verifier')
  window.history.replaceState({}, document.title, window.location.pathname)
  return tokens.id_token
}

export function getStoredToken() {
  return appConfig.demoMode
    ? sessionStorage.getItem('atlas_demo_authenticated') ? 'demo-token' : null
    : sessionStorage.getItem('atlas_id_token')
}

export function logout() {
  sessionStorage.clear()
  if (!appConfig.demoMode && appConfig.cognitoDomain && appConfig.clientId) {
    const params = new URLSearchParams({
      client_id: appConfig.clientId,
      logout_uri: appConfig.logoutUri,
    })
    window.location.assign(`${appConfig.cognitoDomain}/logout?${params.toString()}`)
    return
  }
  window.location.reload()
}
