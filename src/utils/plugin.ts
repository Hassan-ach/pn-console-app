const ERROR_MAP: Record<string, string> = {
  SESSION_PASSWORD_NEEDED: 'This account requires two-factor authentication.',
  PHONE_NUMBER_INVALID: 'The phone number is invalid. Check the format (+countrycode...).',
  PHONE_CODE_INVALID: 'The verification code is incorrect.',
  PHONE_CODE_EXPIRED: 'The verification code has expired. Request a new one.',
  AUTH_KEY_DUPLICATED: 'This session was terminated by another login.',
  FLOOD_WAIT: 'Too many requests. Please wait a moment and try again.',
  CHAT_ID_INVALID: 'The chat ID or username could not be found.',
  USERNAME_NOT_OCCUPIED: 'This username does not exist.',
};

export function userError(raw: string, fallback: string): string {
  const key = Object.keys(ERROR_MAP).find(k => raw.includes(k));
  return key ? ERROR_MAP[key] : fallback;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
