const key = 'classroom-survey-anonymous-token'
export function anonymousToken(): string {
  let token = localStorage.getItem(key)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(key, token)
  }
  return token
}
export function hasSubmitted(id: string): boolean {
  return localStorage.getItem(`classroom-survey-submitted-${id}`) === 'true'
}
export function markSubmitted(id: string): void {
  localStorage.setItem(`classroom-survey-submitted-${id}`, 'true')
}
