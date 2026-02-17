const mockAuth = {
  signInWithOAuth: jest.fn(),
  exchangeCodeForSession: jest.fn(),
  setSession: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  onAuthStateChange: jest
    .fn()
    .mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
};

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockResolvedValue({ error: null }),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
});

const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });

const mockSupabase = {
  auth: mockAuth,
  from: mockFrom,
  rpc: mockRpc,
};

export function getSupabase() {
  return mockSupabase;
}
