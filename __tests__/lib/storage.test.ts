import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { getCurrentUserId, recordCheckIn } from '../../lib/storage';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(), signInAnonymously: jest.fn() },
    rpc: jest.fn(),
  },
}));
const auth = supabase.auth as unknown as {
  getUser: jest.Mock;
  signInAnonymously: jest.Mock;
};
const rpc = supabase.rpc as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  auth.getUser.mockResolvedValue({ data: { user: null } });
});
it('reading an unauthenticated screen preserves local identity without creating an account', async () => {
  const first = await getCurrentUserId();
  expect(first).toMatch(/^local-/);
  expect(await getCurrentUserId()).toBe(first);
  expect(auth.signInAnonymously).not.toHaveBeenCalled();
});
it('passes the fresh CAPTCHA token to anonymous authentication', async () => {
  auth.signInAnonymously.mockResolvedValue({
    data: { user: { id: 'owner' } },
    error: null,
  });
  expect(await getCurrentUserId('synthetic-captcha')).toBe('owner');
  expect(auth.signInAnonymously).toHaveBeenCalledWith({
    options: { captchaToken: 'synthetic-captcha' },
  });
});
it('does not convert rejected authentication into a synced identity', async () => {
  auth.signInAnonymously.mockResolvedValue({
    data: { user: null },
    error: new Error('rejected'),
  });
  await expect(getCurrentUserId('synthetic-captcha')).rejects.toThrow(
    'secure session'
  );
});
it('uses the existing session without creating another account', async () => {
  auth.getUser.mockResolvedValue({ data: { user: { id: 'owner' } } });
  expect(await getCurrentUserId()).toBe('owner');
  expect(auth.signInAnonymously).not.toHaveBeenCalled();
});
it('requests a singular PostgREST row and returns authoritative progress', async () => {
  const row = {
    id: 'commitment',
    check_ins: ['2026-10-12'],
    days_completed: 1,
  };
  const single = jest.fn().mockResolvedValue({ data: row, error: null });
  rpc.mockReturnValue({ single });
  expect(await recordCheckIn('commitment')).toEqual(row);
  expect(single).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith('record_check_in', {
    target_id: 'commitment',
  });
});
it('rejects failed check-ins without persisting local success', async () => {
  rpc.mockReturnValue({
    single: jest
      .fn()
      .mockResolvedValue({ data: null, error: new Error('offline') }),
  });
  await expect(recordCheckIn('commitment')).rejects.toThrow('Could not save');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
